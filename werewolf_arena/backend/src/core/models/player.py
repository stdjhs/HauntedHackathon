# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
玩家数据模型
Player Data Models
"""

import random
from typing import Any, Dict, List, Optional, Tuple

from src.config import MAX_DEBATE_TURNS, NUM_PLAYERS
from src.core.game.prompts import ACTION_PROMPTS_AND_SCHEMAS
from src.core.models.game_state import GameView, to_dict
from src.core.models.logs import LmLog
from src.utils.helpers import Deserializable

# 角色常量
VILLAGER = "Villager"
WEREWOLF = "Werewolf"
SEER = "Seer"
DOCTOR = "Doctor"


def group_and_format_observations(observations):
    """按回合分组并格式化观察记录

    Args:
        observations: 字符串列表，每个字符串以"Round X:"开头

    Returns:
        格式化后的观察记录列表
    """
    grouped = {}
    for obs in observations:
        round_num = int(obs.split(":", 1)[0].split()[1])
        obs_text = obs.split(":", 1)[1].strip().replace('"', "")
        grouped.setdefault(round_num, []).append(obs_text)

    formatted_obs = []
    for round_num, round_obs in sorted(grouped.items()):
        formatted_round = f"Round {round_num}:\n"
        formatted_round += "\n".join(f"   - {obs}" for obs in round_obs)
        formatted_obs.append(formatted_round)

    return formatted_obs


class Player(Deserializable):
    """玩家基类"""

    def __init__(
        self,
        name: str,
        role: str,
        model: Optional[str] = None,
        personality: Optional[str] = "",
    ):
        self.name = name
        self.role = role
        self.personality = personality
        self.model = model
        self.observations: List[str] = []
        self.bidding_rationale = ""
        self.gamestate: Optional[GameView] = None

    def initialize_game_view(
        self, round_number, current_players, other_wolf=None
    ) -> None:
        """初始化游戏视图"""
        self.gamestate = GameView(round_number, current_players, other_wolf)

    def _add_observation(self, observation: str):
        """添加观察记录"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )

        self.observations.append(
            f"Round {self.gamestate.round_number}: {observation}"
        )

    def add_announcement(self, announcement: str):
        """添加游戏公告到观察记录"""
        self._add_observation(f"Moderator Announcement: {announcement}")

    def _get_game_state(self) -> Dict[str, Any]:
        """获取玩家视角的游戏状态"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )

        remaining_players = [
            f"{player} (You)" if player == self.name else player
            for player in self.gamestate.current_players
        ]
        random.shuffle(remaining_players)
        formatted_debate = [
            f"{author} (You): {dialogue}"
            if author == self.name
            else f"{author}: {dialogue}"
            for author, dialogue in self.gamestate.debate
        ]

        formatted_observations = group_and_format_observations(self.observations)

        return {
            "name": self.name,
            "role": self.role,
            "round": self.gamestate.round_number,
            "observations": formatted_observations,
            "remaining_players": ", ".join(remaining_players),
            "debate": formatted_debate,
            "bidding_rationale": self.bidding_rationale,
            "debate_turns_left": MAX_DEBATE_TURNS - len(formatted_debate),
            "personality": self.personality,
            "num_players": NUM_PLAYERS,
            "num_villagers": NUM_PLAYERS - 4,
        }

    def _generate_action(
        self,
        action: str,
        options: Optional[List[str]] = None,
    ) -> Tuple[Optional[Any], LmLog]:
        """生成玩家行动（需要LLM客户端，将在后续重构中实现依赖注入）"""
        # 这里暂时保留原有逻辑，后续会通过依赖注入重构
        from src.services.llm.generator import generate

        game_state = self._get_game_state()
        if options:
            game_state["options"] = (", ").join(options)
        prompt_template, response_schema = ACTION_PROMPTS_AND_SCHEMAS[action]

        result_key, allowed_values = (
            (action, options)
            if action in ["vote", "remove", "investigate", "protect", "bid"]
            else (None, None)
        )

        # Set temperature based on allowed_values
        temperature = 0.5 if allowed_values else 1.0

        return generate(
            prompt_template,
            response_schema,
            game_state,
            model=self.model,
            temperature=temperature,
            allowed_values=allowed_values,
            result_key=result_key,
        )

    def vote(self) -> Tuple[Optional[str], LmLog]:
        """投票"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )
        options = [
            player
            for player in self.gamestate.current_players
            if player != self.name
        ]
        random.shuffle(options)
        vote, log = self._generate_action("vote", options)
        if vote is not None and len(self.gamestate.debate) == MAX_DEBATE_TURNS:
            self._add_observation(
                f"After the debate, I voted to remove {vote} from the game."
            )
        return vote, log

    def bid(self) -> Tuple[Optional[int], LmLog]:
        """竞价发言"""
        bid, log = self._generate_action("bid", options=["0", "1", "2", "3", "4"])
        if bid is not None:
            bid = int(bid)
            self.bidding_rationale = log.result.get("reasoning", "")
        return bid, log

    def debate(self) -> Tuple[Optional[str], LmLog]:
        """参与辩论"""
        result, log = self._generate_action("debate", [])
        if result is not None:
            say = result.get("say", None)
            return say, log
        return result, log

    def summarize(self) -> Tuple[Optional[str], LmLog]:
        """总结游戏状态"""
        result, log = self._generate_action("summarize", [])
        if result is not None:
            summary = result.get("summary", None)
            if summary is not None:
                summary = summary.strip('"')
                self._add_observation(f"Summary: {summary}")
            return summary, log
        return result, log

    def to_dict(self) -> Any:
        return to_dict(self)

    @classmethod
    def from_json(cls, data: Dict[Any, Any]):
        name = data["name"]
        role = data["role"]
        model = data.get("model", None)
        o = cls(name=name, role=role, model=model)
        o.gamestate = data.get("gamestate", None)
        o.bidding_rationale = data.get("bidding_rationale", "")
        o.observations = data.get("observations", [])
        return o


class Villager(Player):
    """村民"""

    def __init__(
        self,
        name: str,
        model: Optional[str] = None,
        personality: Optional[str] = None,
    ):
        super().__init__(
            name=name, role=VILLAGER, model=model, personality=personality
        )

    @classmethod
    def from_json(cls, data: dict[Any, Any]):
        name = data["name"]
        model = data.get("model", None)
        o = cls(name=name, model=model)
        o.gamestate = data.get("gamestate", None)
        o.bidding_rationale = data.get("bidding_rationale", "")
        o.observations = data.get("observations", [])
        return o


class Werewolf(Player):
    """狼人"""

    def __init__(
        self,
        name: str,
        model: Optional[str] = None,
        personality: Optional[str] = None,
    ):
        super().__init__(
            name=name, role=WEREWOLF, model=model, personality=personality
        )

    def _get_game_state(self, **kwargs) -> Dict[str, Any]:
        """获取游戏状态（包含狼人专属信息）"""
        state = super()._get_game_state(**kwargs)
        state["werewolf_context"] = self._get_werewolf_context()
        return state

    def eliminate(self) -> Tuple[Optional[str], LmLog]:
        """选择淘汰目标"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )

        options = [
            player
            for player in self.gamestate.current_players
            if player != self.name and player != self.gamestate.other_wolf
        ]
        random.shuffle(options)

        try:
            eliminate, log = self._generate_action("remove", options)

            # 验证返回的结果
            if eliminate is None:
                print(f"Warning: {self.name} (Werewolf) did not return a valid eliminate target, using default")
                # 选择一个默认目标
                default_target = options[0] if options else None
                return default_target, LmLog(
                    prompt=f"Default target selected due to empty response",
                    raw_resp="Empty response",
                    result={"remove": default_target, "reasoning": "Default selection due to AI failure"}
                )

            # 验证返回的目标是否在有效选项中
            if eliminate not in options:
                print(f"Warning: {self.name} (Werewolf) chose invalid target '{eliminate}', using default")
                default_target = options[0] if options else None
                return default_target, LmLog(
                    prompt=f"Invalid target '{eliminate}', using default {default_target}",
                    raw_resp=f"Invalid target: {eliminate}",
                    result={"remove": default_target, "reasoning": f"Corrected invalid choice '{eliminate}' to default"}
                )

            return eliminate, log

        except Exception as e:
            print(f"Error during eliminate action for {self.name}: {e}")
            # 出现异常时返回默认目标
            default_target = options[0] if options else None
            return default_target, LmLog(
                prompt=f"Error during eliminate action: {str(e)}",
                raw_resp=f"Error: {str(e)}",
                result={"remove": default_target, "reasoning": f"Error fallback to default target"}
            )

    def _get_werewolf_context(self):
        """获取狼人上下文信息"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )

        if self.gamestate.other_wolf in self.gamestate.current_players:
            context = f"\n- The other Werewolf is {self.gamestate.other_wolf}."
        else:
            context = (
                f"\n- The other Werewolf, {self.gamestate.other_wolf}, was exiled by"
                " the Villagers. Only you remain."
            )

        return context

    @classmethod
    def from_json(cls, data: dict[Any, Any]):
        name = data["name"]
        model = data.get("model", None)
        o = cls(name=name, model=model)
        o.gamestate = data.get("gamestate", None)
        o.bidding_rationale = data.get("bidding_rationale", "")
        o.observations = data.get("observations", [])
        return o


class Seer(Player):
    """预言家"""

    def __init__(
        self,
        name: str,
        model: Optional[str] = None,
        personality: Optional[str] = None,
    ):
        super().__init__(name=name, role=SEER, model=model, personality=personality)
        self.previously_unmasked: Dict[str, str] = {}

    def unmask(self) -> Tuple[Optional[str], LmLog]:
        """调查玩家身份"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )

        options = [
            player
            for player in self.gamestate.current_players
            if player != self.name and player not in self.previously_unmasked.keys()
        ]
        random.shuffle(options)
        return self._generate_action("investigate", options)

    def reveal_and_update(self, player, role):
        """揭示并更新调查结果"""
        self._add_observation(
            f"During the night, I decided to investigate {player} and learned they are a {role}."
        )
        self.previously_unmasked[player] = role

    @classmethod
    def from_json(cls, data: dict[Any, Any]):
        name = data["name"]
        model = data.get("model", None)
        o = cls(name=name, model=model)
        o.previously_unmasked = data.get("previously_unmasked", {})
        o.gamestate = data.get("gamestate", None)
        o.bidding_rationale = data.get("bidding_rationale", "")
        o.observations = data.get("observations", [])
        return o


class Doctor(Player):
    """医生"""

    def __init__(
        self,
        name: str,
        model: Optional[str] = None,
        personality: Optional[str] = None,
    ):
        super().__init__(
            name=name, role=DOCTOR, model=model, personality=personality
        )

    def save(self) -> Tuple[Optional[str], LmLog]:
        """选择保护目标"""
        if not self.gamestate:
            raise ValueError(
                "GameView not initialized. Call initialize_game_view() first."
            )

        options = list(self.gamestate.current_players)
        random.shuffle(options)
        protected, log = self._generate_action("protect", options)
        if protected is not None:
            self._add_observation(f"During the night, I chose to protect {protected}")
        return protected, log

    @classmethod
    def from_json(cls, data: dict[Any, Any]):
        name = data["name"]
        model = data.get("model", None)
        o = cls(name=name, model=model)
        o.gamestate = data.get("gamestate", None)
        o.bidding_rationale = data.get("bidding_rationale", "")
        o.observations = data.get("observations", [])
        return o
