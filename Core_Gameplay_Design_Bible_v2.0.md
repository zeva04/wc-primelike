# Chapter 1 — Introduction

---

# Purpose of this Document

This document defines the complete Core Gameplay of the project.

While the Game Vision establishes the creative direction, player fantasy, design pillars and long-term vision of the game, this document specifies how that vision becomes actual gameplay.

Its purpose is to answer one central question:

> **"What does the player actually do from the moment a run begins until the World Cup ends?"**

Every mechanic described here exists to support that experience.

This document intentionally excludes:

- Technical implementation
- Programming architecture
- Artificial Intelligence algorithms
- Mathematical formulas
- Balance values
- User Interface layouts
- Art direction
- Audio implementation

Those subjects belong to the Game Design Document (GDD) and Technical Design Documents (TDD).

The Core Gameplay Design focuses exclusively on player interaction.

---

# Relationship with the Game Vision

The Game Vision is the project's source of truth.

This document never replaces it.

Instead, it transforms abstract design intentions into concrete gameplay systems.

The relationship between both documents can be summarized as follows.

Game Vision answers:

- Why are we making this game?
- What emotions should players experience?
- What makes this project unique?
- What are the design pillars?

Core Gameplay answers:

- What decisions does the player make?
- When are those decisions made?
- Why are they meaningful?
- How do systems connect together?
- How does one decision influence the next?

Every gameplay system described in this document must respect the principles established by the Game Vision.

Whenever a future mechanic contradicts those principles, the mechanic should be redesigned rather than modifying the vision.

---

# Scope

This document defines every gameplay interaction occurring during a single World Cup run.

It includes:

- Tournament structure
- Daily gameplay loop
- Preparation systems
- Event system
- Squad management
- Player progression
- Team philosophy
- Match structure
- Match sequences
- Dynamic storytelling
- Run progression

The objective is to completely define the player's gameplay loop before implementation begins.

If implemented correctly, every programmer working on an isolated gameplay module should be capable of understanding how that module interacts with every other gameplay system.

---

# Design Philosophy

This project is not intended to become a football simulator.

Neither is it intended to become a traditional roguelike with a football theme.

Instead, it seeks to combine both genres by giving equal importance to preparation and execution.

Preparation creates opportunities.

Execution determines whether those opportunities become success.

This relationship defines the entire experience.

Every gameplay system should reinforce that loop.

---

# Core Gameplay Identity

The player does not control a football club.

The player does not build the strongest possible roster.

The player does not optimize spreadsheets.

Instead...

The player becomes the national team manager responsible for navigating an unpredictable World Cup.

Every day introduces new problems.

Every match validates previous decisions.

Every run generates a different football story.

The objective is therefore not to maximize numbers.

The objective is to continually adapt to changing circumstances while remaining faithful to the team's football philosophy.

---

# Player Skill

One of the fundamental design decisions of the project is defining what player skill actually means.

Skill is NOT:

- Memorizing optimal strategies.
- Grinding player attributes.
- Following deterministic decision trees.

Skill IS:

- Reading the current context.
- Identifying the team's biggest problem.
- Prioritizing under uncertainty.
- Managing opportunity cost.
- Executing decisive football actions during matches.

The game rewards adaptability rather than memorization.

---

# Opportunity Cost

Opportunity Cost is the most important gameplay principle of the entire project.

Every meaningful decision must imply giving something else up.

Examples include:

- Training instead of recovering.
- Accepting an opportunity event instead of following the original daily plan.
- Choosing tactical preparation instead of improving player development.
- Substituting an exhausted star instead of risking an injury.

If a decision has no meaningful trade-off, it is not considered good gameplay.

Whenever new systems are designed in the future, they should be evaluated against this principle first.

---

# Dynamic Context

Unlike traditional sports management games, this project is not designed around optimization.

It is designed around adaptation.

Every day changes the context in which future decisions are made.

Examples include:

- Weather
- Player injuries
- Team morale
- Philosophy development
- Match results
- Opponent behaviour
- World Cup news
- Rare events

The player should never feel they are repeating a solved puzzle.

Instead, every new day should introduce a slightly different problem requiring a new solution.

---

# Emergent Storytelling

The objective of the game is not merely winning the World Cup.

The objective is generating memorable football stories.

Examples include:

- An unknown striker becoming the revelation of the tournament.
- A goalkeeper carrying an underdog nation through penalty shootouts.
- A tactical philosophy slowly evolving until defining the team's identity.
- A sequence of unexpected events forcing the player to completely reinvent their strategy.

The game should produce stories that players naturally want to tell after finishing a run.

Statistics exist to support those stories.

Stories do not exist to justify statistics.

---

# Definition of Success

A successful run is not measured exclusively by the final tournament result.

The desired player reaction after finishing a run should be:

"I can't believe everything that happened during this World Cup."

rather than

"I increased several player attributes."

Winning the World Cup remains the ultimate objective.

However, the emotional value of the journey is considered equally important.

---

# Design Rules Established by this Chapter

The following principles become mandatory constraints for every gameplay system described in the remainder of this document.

1. Preparation and matches have equal importance.

2. Every meaningful decision has an opportunity cost.

3. Adaptation is more valuable than memorization.

4. Context always changes.

5. Systems exist to generate stories.

6. Stories are remembered more than statistics.

7. The player develops a football philosophy rather than simply improving players.

8. Winning matters.

9. The journey matters just as much.

10. Every future gameplay mechanic must reinforce at least one of these principles.

# Chapter 2 — Player Experience

---

# Purpose

Before defining gameplay systems, it is necessary to define the experience those systems are intended to create. This chapter does not describe mechanics; instead, it establishes the psychological journey experienced by the player throughout a single World Cup run. Every future gameplay decision should reinforce these emotional objectives, and whenever a future mechanic conflicts with the desired player experience, the mechanic should be reconsidered.

---

# The Player Fantasy

The player is not controlling eleven footballers, not acting as a spectator, and not managing a football club over multiple seasons. Instead, the player becomes the national team manager responsible for navigating the uncertainty of a single FIFA World Cup. The player prepares the team, builds an identity, responds to unexpected situations, makes difficult trade-offs, and then experiences the decisive moments that determine whether those decisions were correct. The fantasy is therefore not "I play football," but rather: **"I prepare a team to survive an unpredictable World Cup."**

---

# The Core Emotional Loop

Every day should create the same emotional rhythm: Curiosity → Analysis → Decision → Expectation → Validation → Adaptation. This emotional cadence repeats throughout the entire campaign. Preparation creates anticipation, matches provide answers, and those answers generate new questions, causing the loop to repeat.

---

# Curiosity

Curiosity is the first emotion experienced every day. The player should wake up wondering: "What happened while I was away?" The objective is not simply to provide information, but to create anticipation. The World Cup Daily exists for this purpose, and players should become excited before making any decisions. Some days may contain extraordinary events, while others may contain only minor developments; that contrast is intentional, as extraordinary moments only remain extraordinary if quiet days also exist.

---

# Uncertainty

Uncertainty is one of the defining characteristics of the project. Players should never completely understand what the next day will bring, nor what the next match sequence will be. Uncertainty exists in two layers: strategic uncertainty (events, opponent preparation, weather, player condition, team morale) and tactical uncertainty (match situations, sequence types, sequence duration, opponent reactions). The purpose of uncertainty is not randomness, but forcing adaptation.

---

# Decision Making

Every meaningful decision should force the player to sacrifice something valuable. Examples include training versus recovery, developing philosophy versus improving individuals, accepting a rare opportunity versus following the original plan, and changing tactics versus maintaining consistency. Good gameplay emerges from opportunity cost, and whenever one option becomes objectively superior, gameplay loses depth. Therefore, every important decision should remain contextual, with the correct answer depending on current squad, team philosophy, opponent, upcoming fixtures, player condition, events, and tournament situation. No universal optimal strategy should exist.

---

# Adaptation

The player should never feel like they are executing a solved strategy. Instead, every day presents a slightly different puzzle, every match asks different questions, and every run creates different stories. Mastery comes from interpreting changing contexts rather than memorizing solutions, which differentiates the project from traditional management simulations.

---

# Preparation

Preparation is not considered downtime; preparation is gameplay. It should demand as much attention as matches, and players are expected to spend significant time thinking before advancing the day. This phase rewards observation, planning, prioritization, and risk assessment. The objective is making players feel like football managers rather than menu navigators.

---

# Matches

Matches represent validation. Everything the player has done during preparation becomes visible on the pitch. Good preparation should generate more opportunities, better situations, and football consistent with the chosen philosophy. However, preparation never guarantees victory; execution remains essential, and the player must still perform during decisive sequences.

---

# Emergent Stories

One of the primary objectives of the project is creating stories that players naturally remember after finishing a run. These stories should emerge from gameplay rather than scripted narrative. Examples include a goalkeeper becoming the tournament hero, an unknown striker transforming into the revelation of the competition, a tactical philosophy evolving until defining the team's identity, or a storm forcing the player to completely redesign preparation. Every memorable story should originate from gameplay systems interacting together, never from scripted sequences alone.

---

# Player Mastery

As players become more experienced, their improvement should come from better judgement, not from memorizing hidden systems. Experienced players should gradually become better at recognizing priorities, understanding opportunity cost, reading opponent behaviour, managing risk, building coherent philosophies, and executing decisive football actions. This creates a satisfying long-term learning curve without relying on artificial progression.

---

# Desired Player Thoughts

Throughout the campaign, the design should continuously encourage thoughts such as: "What happened today?", "I wasn't expecting this.", "I have no idea which option is best.", "If I choose this, what am I giving up?", "My striker is finally playing well.", "I built this philosophy.", "This sequence feels completely different from my previous run.", "I should have prepared better.", and "I can't believe everything that happened during this World Cup." These thoughts represent successful gameplay.

---

# What the Player Should Never Feel

The following emotions indicate design failure: "I always choose the same action.", "I already know exactly what today's optimal decision is.", "My philosophy doesn't actually change how the team plays.", "The match outcome was completely outside my control.", "My preparation didn't matter.", "The game only changed numbers.", and "I'm grinding statistics." Whenever players repeatedly experience these feelings, the corresponding systems should be redesigned.

---

# Chapter Principles

This chapter establishes the emotional objectives guiding every gameplay system. The player should experience curiosity before every day, meaningful decisions during preparation, adaptation instead of optimization, validation during matches, growth through stories, and mastery through judgement. If future mechanics reinforce these emotions, they belong in the project; if they do not, they should be questioned regardless of how interesting they appear individually.

# Chapter 3 — Complete Gameplay Loop

---

# Purpose

This chapter defines the complete gameplay structure of a single World Cup run. Every gameplay system described in later chapters exists to support one or more stages of this loop. Understanding this chapter should allow any designer or programmer to immediately understand where every mechanic belongs within the overall experience.

---

# The Complete Gameplay Structure

A World Cup run is composed of nested gameplay loops, each operating at a different scale.

```
Run

↓

Tournament

↓

Day

↓

Match

↓

Sequence

↓

Football Action
```

Each level creates context for the level below it, and likewise, the result of every lower loop feeds information back into the higher ones. This continuous feedback creates the emergent stories that define the game.

---

# Loop Hierarchy

## Level 1 — The Run

The Run represents one complete World Cup. It begins when the player selects a national team and ends when the team wins the World Cup or is eliminated. Everything that happens inside the run is temporary. The objective of a run is always the same:

> Win the FIFA World Cup.

However, every run should feel fundamentally different due to the interaction between preparation, events, philosophy, opponents and player development.

---

## Level 2 — Tournament Loop

The tournament loop follows the official World Cup structure:

Group Stage ↓ Knockout Stage ↓ Champion or Elimination

The tournament creates the long-term strategic context, including upcoming opponents, qualification pressure, injuries accumulating, philosophy development, squad evolution and tournament narratives. Unlike individual matches, tournament decisions often have delayed consequences.

---

## Level 3 — Daily Loop

The Day is the fundamental gameplay unit, and every day follows exactly the same structure:

```
Start of Day

↓

World Cup Daily

↓

Resolve Important Events

↓

Free Management Phase

↓

Choose Main Daily Action

↓

Apply Consequences

↓

Advance Day
```

This loop repeats throughout the tournament and represents the player's primary decision-making space, where most strategic gameplay occurs.

---

# Daily Loop Philosophy

The player should never begin a day asking:

> "What button should I press?"

Instead, the player should think:

> "What problem does today's World Cup present?"

Every system inside the daily loop exists to answer that question.

---

## World Cup Daily

Purpose: create curiosity before planning. The Daily summarizes everything that changed since yesterday, including squad news, opponent developments, World Cup headlines, rumours and previous consequences. Its objective is not information density but anticipation.

---

## Event Resolution

Events represent changes to the current context, and important events are immediately resolved before planning begins. Events exist for one primary reason: they modify today's decision space. Some create opportunities, others create restrictions, and others simply change available information.

---

## Free Management

This phase consumes no time. The player may freely inspect the squad, equip items, modify tactics, review philosophy, analyse opponents and prepare for the upcoming fixture. The player may think without pressure, and only executing the main action advances time.

---

## Main Daily Action

Every day contains exactly one meaningful action, such as Training, Recovery, Tactical Session, Team Bonding or Special Opportunity. This action consumes the day, and its opportunity cost creates strategic depth. No action should ever become universally optimal.

---

# Match Loop

When a match day arrives, gameplay transitions into the match loop. Preparation stops and validation begins. The match exists to answer one question:

> "Were the previous decisions correct?"

Preparation influences quantity of opportunities, quality of opportunities, tactical identity and player condition, while execution determines the final outcome.

---

# Match Structure

Each match alternates between observation and interaction:

```
Live Match Simulation

↓

Key Sequence

↓

Live Match Simulation

↓

Key Sequence

↓

...

↓

Final Whistle
```

This rhythm intentionally mirrors real football. Most of the match is observed, and only decisive moments become interactive.

---

# Sequence Loop

Key Sequences represent the player's direct control, and each sequence is a miniature football story with the following general structure:

```
Situation

↓

Decision

↓

Football Action

↓

Reaction

↓

Decision

↓

Football Action

↓

Climax

↓

Outcome
```

Sequences vary in duration, complexity, tactical identity and emotional intensity. The player should never know how long a sequence will last.

---

# Football Action Loop

Football Actions are the smallest gameplay unit, including Pass, Control, Dribble, Press, Tackle, Header, Shoot and Save. Sequences are built by combining these reusable actions. This modular approach allows a large variety of football situations without requiring every sequence to be handcrafted.

---

# Feedback Between Loops

One of the project's defining characteristics is continuous feedback. Preparation influences matches, matches influence players, players influence preparation, preparation evolves philosophy and philosophy changes future matches. This creates a self-reinforcing gameplay cycle. The player is therefore never progressing through isolated systems, as every system continuously modifies every other system.

---

# The Complete Gameplay Flow

A simplified run can therefore be represented as:

```
Choose National Team

↓

World Cup Begins

↓

Daily Loop

↓

Preparation

↓

Match

↓

Player Stories

↓

Tournament Progression

↓

Daily Loop

↓

...

↓

World Cup Ends

↓

Run Ends
```

The player repeats the same core loop throughout the campaign. What changes is never the structure but the context, and that changing context is responsible for the game's replayability.

---

# Chapter Principles

This chapter establishes the structural rules governing every gameplay system:

1. The Day is the fundamental gameplay unit.

2. Preparation is the primary strategic layer.

3. Matches validate preparation.

4. Sequences provide direct player execution.

5. Football Actions are reusable gameplay building blocks.

6. Every loop feeds information back into higher-level loops.

7. Replayability comes from changing context rather than changing structure.

# Chapter 4 — The Daily Loop

---

# 4.1 Purpose

The Daily Loop is the primary gameplay loop of the project. It represents the majority of the player's decision making throughout a World Cup run. Although football matches provide the emotional climax of the experience, the Daily Loop provides the strategic gameplay that gives those matches meaning. Every day asks the player a different question, and every match answers whether those decisions were correct. This relationship defines the identity of the game. Preparation is not downtime; preparation is gameplay. The objective of the Daily Loop is therefore not simply advancing the calendar, but presenting the player with a constantly changing strategic puzzle.

---

# Why the Day?

One of the earliest design decisions of the project was defining the "day" as the fundamental gameplay unit. Alternative approaches were considered, including action points, weekly planning, and unlimited management between matches. These alternatives were discarded because they reduced the importance of opportunity cost. Using the day as the primary resource naturally creates meaningful decisions, since every important action consumes something irreplaceable: time. This immediately forces prioritization. Training today means not doing something else today, and every decision therefore creates visible consequences.

---

# The Design Goal

The player should never begin a day asking:

> "What should I click first?"

Instead, the player should ask:

> "Given everything that happened today, what is my biggest problem?"

That subtle difference defines the entire gameplay philosophy. The Daily Loop is not about executing routines; it is about solving problems.

---

# 4.2 Daily Philosophy

The Daily Loop follows one central principle: every new day presents a new puzzle. The puzzle is never identical because its context constantly changes. Examples of changing context include new injuries, weather, upcoming opponents, player morale, team fatigue, tournament standings, recent performances, rare events, and philosophy progression. Rather than increasing mechanical complexity, replayability is generated through changing circumstances. The player gradually becomes better at interpreting situations rather than memorizing optimal solutions.

---

# Opportunity Cost

Opportunity Cost is the governing principle of the Daily Loop. Every meaningful decision must require giving something else up. Examples include training instead of resting, developing team cohesion instead of tactical preparation, accepting a sponsor opportunity instead of following the original plan, and preparing for the next opponent instead of improving long-term player growth. If the player can always perform every desirable action, decision making disappears. Therefore, time is intentionally limited.

---

# No Dominant Strategy

One of the primary design objectives of the Daily Loop is preventing dominant strategies. The game should never teach players:

> "Always train first."

or

> "Always recover before important matches."

Instead, the correct decision should always depend on the current situation. A tired squad values recovery, a weak squad may desperately need training, a tactical mismatch encourages preparation, and a rare event may completely change today's priorities. The optimal action should emerge from context rather than fixed rules.

---

# Uncertainty

The Daily Loop intentionally incorporates uncertainty. Players should never know exactly what today's puzzle will become before the day begins, nor whether today's event will become an opportunity or a problem. Examples include unexpected injuries, rare sponsor offers, media pressure, training interruptions, and weather changes. This uncertainty exists to encourage adaptation and should never exist simply to punish the player.

---

# The Daily Mental Model

The intended player thought process is:

Discover → Understand → Prioritize → Commit → Accept the consequences → Adapt tomorrow.

This sequence repeats throughout the entire tournament, and over time experienced players become faster and better at interpreting complex situations.

---

# 4.3 Daily Flow

Every day follows exactly the same high-level structure.

```text
Start of Day

↓

World Cup Daily

↓

Important Events

↓

Management Phase

↓

Choose Main Daily Action

↓

Resolve Consequences

↓

Advance Day
```

Although the structure remains constant, the content inside each stage changes every day. This consistency provides clarity, while the changing context provides replayability.

---

# Stage 1 — Start of Day

The player enters a completely new context where no decisions have been made yet. The objective is creating anticipation, and players should immediately wonder:

> "What changed?"

This question naturally leads into the World Cup Daily.

---

# Stage 2 — World Cup Daily

The Daily summarizes the most relevant developments affecting the current campaign. Its purpose is not information but curiosity, and players should become excited before making decisions. The Daily is intentionally concise, showing only meaningful developments. Detailed design of the World Cup Daily is covered in Section 4.4.

---

# Stage 3 — Important Events

After reading the Daily, the player immediately resolves any high-priority events. Events modify today's strategic landscape by introducing opportunities, creating restrictions, or revealing new information. Importantly, events occur before planning begins, ensuring the player always plans using the latest available information. Detailed event design is covered in Section 4.5.

---

# Stage 4 — Management Phase

Once the day's context is fully understood, the player enters an unrestricted planning phase where time is frozen. Players may freely inspect every relevant system, and no penalties exist for careful planning. The objective is thoughtful decision making rather than execution speed. Detailed management systems are covered in later chapters.

---

# Stage 5 — Main Daily Action

After planning, the player commits to one meaningful action that consumes the day and represents today's strategic investment. Choosing this action is often the most important decision made outside football matches. Once confirmed, time advances.

---

# Stage 6 — Resolve Consequences

The selected action immediately produces consequences such as player progression, fatigue changes, morale adjustments, philosophy development, new opportunities, and unexpected setbacks. These outcomes become part of tomorrow's context.

---

# Stage 7 — Advance Day

The calendar advances and the player immediately returns to the beginning of the loop. A completely new strategic puzzle begins. The structure remains identical, but the circumstances never do.

---

# Design Principles

The Daily Loop establishes the following permanent design rules:

1. The Day is the primary strategic gameplay unit.

2. Preparation is gameplay, not downtime.

3. Every day presents a new problem.

4. Opportunity Cost drives decision making.

5. No dominant daily action may exist.

6. The player adapts to changing context rather than following fixed routines.

7. Every completed day changes tomorrow's puzzle.

Together, these principles transform the Daily Loop from a simple calendar system into the strategic heart of the entire game.

# 4.4 World Cup Daily

---

# Purpose

The World Cup Daily is the player's first interaction every new day. Its purpose is **not** to function as a newspaper; its purpose is to establish the strategic context from which the player will make today's decisions. The Daily exists to answer one simple question:

> **"What changed since yesterday?"**

By answering that question before the player enters management, the game creates anticipation, curiosity and context. Without the Daily, changes would simply appear inside menus; with the Daily, those same changes become part of the World's narrative.

---

# Design Philosophy

The World Cup Daily should never become a reading game. The objective is not information density; the objective is emotional anticipation. Every entry should satisfy at least one of these goals:

* Create curiosity.
* Explain a gameplay consequence.
* Reveal an opportunity.
* Increase immersion.
* Build tournament atmosphere.

If a piece of information accomplishes none of these goals, it should not appear.

---

# The Daily as a Context Generator

The Daily does **not** ask the player to make decisions; instead, it prepares the player's mind before decision making begins. This distinction is extremely important. The gameplay loop is intentionally structured as:

Information ↓ Interpretation ↓ Decision

Never:

Decision ↓ Explanation

The player should always understand today's context before planning.

---

# Information Hierarchy

Not every piece of information deserves the player's attention, so the Daily follows a strict priority hierarchy.

## Priority 1 — Player Team

The player's own national team always receives highest priority. Examples include injuries, suspensions, recovery, morale, outstanding performances, philosophy development and internal events. These directly affect today's decisions.

---

## Priority 2 — Upcoming Opponent

If an upcoming opponent has relevant developments, they may appear. Examples include a star player injured, tactical changes, red card suspension or exceptional recent form. The objective is improving strategic preparation.

---

## Priority 3 — Major Tournament News

Only important tournament-wide stories should appear. Examples include Brazil eliminated, defending champion struggling, unexpected underdog performance or a major upset. These events reinforce the feeling that the World Cup continues beyond the player's own matches.

---

## Priority 4 — World Flavor

Occasionally, low-impact news may appear purely to make the tournament feel alive. Examples include fans celebrating, record attendance, weather forecasts or stadium atmosphere. These entries should remain uncommon, as too many flavour messages reduce pacing.

---

# Information Density

One of the guiding principles of the project is respecting the player's time. Therefore, the Daily should remain intentionally concise, allowing the player to understand today's situation within seconds. The objective is creating excitement, not slowing gameplay.

---

# News Frequency

Not every day should feel equally important. Some days contain multiple meaningful developments, rare events or difficult dilemmas, while other days may contain almost nothing. This contrast is intentional: quiet days create rhythm and make extraordinary days feel genuinely memorable. If every day feels spectacular, eventually none of them do.

---

# Relationship with Events

The Daily and the Event System perform different functions: the Daily informs, while Events transform. Example:

Daily:

> Heavy rain expected during today's training.

Event:

> Heavy Rain
> Training effectiveness reduced by 40%.
> Alternative indoor tactical session available.

The Daily provides context, while the Event changes gameplay. This separation makes the world feel coherent.

---

# Narrative Style

The Daily should feel like a real football news feed. Tone should remain short, direct, readable and football-oriented. The player should naturally skim headlines, not read long paragraphs. Examples:

✔ "Captain returns to training."
✔ "Argentina expected to rotate squad."
✔ "Heavy rain expected."
✔ "Supporters arrive in massive numbers."

Avoid long exposition, lore dumps or extended dialogue. The Daily is a headline system, not a narrative engine.

---

# Replayability

One of the Daily's hidden responsibilities is increasing replayability. Because every tournament generates different injuries, events, rival situations, player stories and tournament narratives, the Daily becomes different every run. Although structurally identical, its content continuously changes. This reinforces one of the project's central principles:

> **The structure remains constant. The context never does.**

---

# Integration with Other Systems

The Daily acts as the communication layer between gameplay systems, reflecting the consequences of player progression, team morale, philosophy, coaching staff, match results, tournament progression and dynamic events. Rather than forcing the player to inspect multiple menus, the Daily naturally summarizes the most important changes, significantly reducing cognitive load while increasing immersion.

---

# UX Principles

The World Cup Daily follows several interface principles.

## Prioritize relevance

The most important information always appears first.

---

## Respect player attention

Only meaningful information is displayed; avoid information overload.

---

## Explain before asking

Players should understand today's situation before making decisions.

---

## Encourage anticipation

Reading the Daily should increase excitement for planning the day and never feel like mandatory exposition.

---

# Example Daily

```text
──────────────────────────────

WORLD CUP DAILY

Day 11

🇨🇻 Cabo Verde prepares for decisive group match.

⚠️ Heavy rain expected during today's training.

🔥 Carlos Mendes continues excellent form after scoring twice.

🇧🇷 Brazil qualifies for the Round of 16.

🇯🇵 Japan loses starting centre-back through suspension.

──────────────────────────────
```

Immediately afterwards, the player enters the Event Resolution phase.

---

# Design Principles

The World Cup Daily establishes the following permanent rules:

1. The Daily exists to create context, not exposition.

2. Information always precedes decision making.

3. Player-related news has absolute priority.

4. Tournament news should reinforce the feeling of a living World Cup.

5. Reading the Daily should take seconds, not minutes.

6. Quiet days are necessary for extraordinary days to feel meaningful.

7. The Daily summarizes the world's state so the player can immediately begin solving today's strategic puzzle.

# 4.5 Event System

---

# Purpose

The Event System is responsible for continuously changing the strategic landscape of the World Cup. Without events, every day would gradually become a routine, but with events, every day becomes a different strategic puzzle. Events are therefore **not** narrative rewards; they are gameplay modifiers whose purpose is introducing uncertainty while preserving meaningful decision making.

---

# Design Philosophy

The Event System follows one fundamental principle:

> **Events exist to change the player's problem, not to randomly reward or punish them.**

This principle governs every event in the game. Whenever designing a new event, the first question should never be "What reward does this event give?" but instead "How does this event change today's decision?" If the answer is "it doesn't", the event should be redesigned.

---

# The Role of Events

Events are the engine that prevents the Daily Loop from becoming repetitive, as they continuously alter available actions, player priorities, risk assessment, information, resource value, and tactical preparation. Because of this, players cannot simply repeat yesterday's strategy and must constantly adapt.

---

# Events Create Problems

A common mistake in strategy games is treating events as reward dispensers, and this project intentionally avoids that philosophy. Events should primarily generate problems, and those problems may later create opportunities. For example, heavy rain makes training less effective, creating a dilemma for the player, rather than simply granting a random reward.

---

# Opportunity Through Constraints

Interesting decisions emerge when restrictions force creativity. For example, if the training ground floods, training becomes unavailable, but an indoor tactical meeting becomes available instead. The restriction creates a new opportunity not because the player received a reward, but because the context changed.

---

# Event Categories

The Event System is divided into three major categories, each fulfilling a different gameplay role.

---

# Context Events

Context Events modify today's strategic environment without consuming the day's action, and their purpose is changing the value of future decisions. Examples include weather, minor injuries, recovery updates, player fatigue, philosophy developments, opponent news, and tournament news. Context Events answer the question: "What is different today?"

---

# Opportunity Events

Opportunity Events introduce optional choices that compete directly with today's main action and always involve opportunity cost. The player must actively choose whether to accept them. Examples include sponsor invitations, experimental equipment, extra tactical sessions, friendly scrimmages, veteran mentor visits, medical treatments, and media appearances. Accepting one means sacrificing another daily action, making Opportunity Events some of the most strategically interesting moments in the game.

---

# Mandatory Events

Mandatory Events represent situations outside the player's control, meaning the player cannot avoid them and must instead adapt. Examples include serious injuries, suspensions, internal conflicts, match postponements, extreme weather, and FIFA sanctions. Mandatory Events exist to reinforce uncertainty and should remain rare to preserve their emotional impact.

---

# Event Severity

Events vary in impact and should exist on different levels of severity rather than being treated equally. For example, a minor event like heavy rain reduces training effectiveness, while a major event like an electrical storm cancels training entirely. Both represent weather but generate completely different strategic puzzles, significantly increasing replayability.

---

# Event Duration

Not every event ends immediately, as events may affect one day, several days, or an entire tournament. For example, minor muscle fatigue may last one day, a player confidence crisis may last multiple matches, and long-term tactical adaptation may last an entire campaign. Duration is another tool for generating strategic diversity.

---

# Event Sources

Events originate from many systems, including the player's squad, opponents, tournament progression, weather, coaching staff, philosophy, player Moment, media, sponsors, and FIFA. Because events emerge from multiple systems, the World Cup feels alive rather than scripted.

---

# Event Timing

Events always occur before planning begins, which is one of the project's most important structural rules.

Daily Flow

```text
World Cup Daily → Important Events → Management
```

Never:

```text
Management → Event → Re-plan everything
```

Players should always make decisions using the latest available information, which greatly reduces frustration.

---

# Dynamic Decision Space

Events may influence gameplay in many different ways, including modifying actions (training unavailable, recovery improved, special opportunity unlocked), modifying effectiveness (training effectiveness reduced, recovery doubled, tactical preparation more effective), modifying information (revealing opponent injuries, hiding tactical information, unlocking scouting reports), modifying resources (increasing fatigue, reducing morale, improving philosophy growth, changing player Moment), and modifying future decisions (unlocking new event chains, creating delayed consequences, opening future opportunities). This flexibility allows the Event System to influence virtually every gameplay system.

---

# Event Chains

Some events should exist independently, while others should create logical continuations. For example, a minor injury may lead to a medical assessment, followed by a recovery decision, and ultimately determine whether the player is available. The objective is making the World Cup feel reactive, where player decisions influence how event chains evolve.

---

# Relationship with Philosophy

Events should never exist independently from the team's football identity. For example, with a High Press philosophy, heavy rain may interrupt training and hurt physical preparation more than tactical preparation, while with a Possession philosophy, the same weather may make an indoor passing session more attractive. The same event can therefore create different strategic puzzles depending on the current philosophy.

---

# Relationship with Player Stories

Events are one of the main catalysts for emergent storytelling. For example, a substitute may receive unexpected training opportunities after a starter's injury, a struggling striker may gain confidence through a sponsor event, or a veteran player may mentor a young prospect. Events should naturally generate stories and never feel like disconnected random encounters.

---

# Replayability

Replayability comes from combinations rather than quantity. For example, Heavy Rain combined with High Press, an injured left back, and a decisive match tomorrow creates a completely different puzzle than Heavy Rain combined with Possession, a fully rested squad, and already being qualified. This combinatorial design dramatically increases replayability without requiring thousands of handcrafted events.

---

# Design Rules for Future Events

Every new event added to the project should satisfy the following checklist:

✓ Does it change today's decision?
✓ Does it create a meaningful trade-off?
✓ Does it reinforce uncertainty rather than randomness?
✓ Does it interact with existing systems?
✓ Can it contribute to an emergent story?
✓ Is it understandable immediately?

If the answer to several of these questions is "no", the event likely does not belong in the game.

---

# Design Principles

The Event System establishes the following permanent rules:

1. Events change context, not just numbers.
2. Events generate problems before generating rewards.
3. Opportunity Events always compete with the day's main action.
4. Mandatory Events create adaptation, not frustration.
5. Event impact may vary from minor to campaign-defining.
6. Events should interact with philosophy, player progression, and tournament context.
7. Replayability emerges from event combinations rather than isolated randomness.
8. Every event should make today's strategic puzzle different from yesterday's.

# 4.6 Management Phase

---

# Purpose

The Management Phase is the player's strategic planning space. Unlike the Event System, which changes the day's context, the Management Phase allows the player to respond to that context. No time passes during this phase, and its purpose is allowing deliberate thinking before committing to the day's main action. The player should feel like a national team manager preparing for an important decision rather than navigating menus.

---

# Design Philosophy

The Management Phase exists to answer one question: **"Given today's situation, how should I prepare?"** The player has complete freedom to inspect information and reorganize the team. However, nothing meaningful happens until the player commits to the Main Daily Action. Thinking is free, but commitment costs time, and this distinction is fundamental.

---

# Frozen Time

One of the defining characteristics of the Management Phase is that time is completely frozen. Players may spend 20 seconds, 5 minutes, or 30 minutes planning their next move. No penalties exist for careful thinking, as the game rewards judgement, not speed.

---

# Available Systems

The player may freely access every preparation-related system. Examples include:

## Squad

* Inspect players.
* Review attributes.
* Check Moment.
* Review fatigue.
* Check injuries.
* Monitor morale.

---

## Formation

Players may modify formation, starting lineup, bench, and positional roles. The objective is adapting to today's context.

---

## Tactical Plan

Players may adjust team instructions, match strategy, football philosophy, and tactical priorities. These decisions shape future matches rather than immediately consuming time.

---

## Equipment

Players may equip boots, equip consumables, assign temporary items, and optimize player loadout. Equipment management is free, but obtaining new equipment is not.

---

## Opponent Analysis

Players may inspect all currently available scouting information, including opponent philosophy, key players, tactical tendencies, known weaknesses, and recent performances. Information may be incomplete depending on previous preparation and events.

---

## Philosophy Review

Players may inspect current philosophy, development progress, strengths, and weaknesses. This encourages long-term thinking before choosing today's action.

---

# No Hidden Costs

Inspecting information should never consume resources. The player should always feel encouraged to gather information before deciding, as punishing curiosity would directly contradict the design philosophy.

---

# Cognitive Role

Mechanically, nothing happens during this phase, but psychologically this is where most strategic gameplay occurs. The player observes, interprets, compares, and plans. Only after this mental process does gameplay advance, which is why the Management Phase should never feel rushed.

---

# Transition to Commitment

The Management Phase always ends with a single question: **"What will today's investment be?"** Answering this question leads directly into the Main Daily Action.

---

# Design Principles

1. Time is frozen during management.

2. Planning should never be punished.

3. Information should always be accessible.

4. The player prepares before committing.

5. The phase exists for thinking, not execution.

---

# 4.7 Main Daily Action

---

# Purpose

The Main Daily Action is the most important decision made during a normal preparation day. It represents the player's strategic investment for that day. Unlike every previous interaction, this decision advances time, and once confirmed, it cannot be undone.

---

# Design Philosophy

Every day allows many possibilities, and the player may inspect countless systems. However, only one meaningful action may consume the day. This restriction creates Opportunity Cost. Without it, preparation would become optimization; with it, preparation becomes prioritization.

---

# One Action Per Day

Exactly one strategic action advances time. Examples include training, recovery, tactical session, team bonding, accepting opportunity events, and special development activities. Future systems should follow the same rule whenever possible.

---

# Why One Action?

This limitation solves several important design problems. It creates meaningful trade-offs, keeps pacing fast, prevents checklist gameplay, encourages adaptation, and makes every day memorable. The player should finish the day remembering what they invested in.

---

# Context Determines Value

The Main Daily Action should never possess a fixed value. Training, recovery, and tactical work are not inherently good; their value emerges entirely from context. For example, an exhausted squad values recovery, an inexperienced squad values training, a decisive knockout match values tactical preparation, and a rare sponsor event may outweigh all of them. No universal priority should exist.

---

# Interaction with Events

Events frequently modify the Main Daily Action. For example, Heavy Rain reduces training effectiveness, a Nike Invitation introduces a new optional action, and a Medical Emergency may make recovery temporarily unavailable. Events therefore reshape—not replace—the player's decision.

---

# Commitment

Selecting the Main Daily Action represents commitment. Once confirmed, time advances, consequences resolve, and tomorrow begins. The player accepts responsibility for that investment.

---

# Design Principles

1. Only one meaningful action advances the day.

2. The action always has an opportunity cost.

3. Its value depends entirely on context.

4. Events modify the decision space, not the rule itself.

5. Commitment should feel significant.

---

# 4.8 End of Day

---

# Purpose

The End of Day closes today's strategic puzzle and prepares tomorrow's. It represents the transition between planning and consequence. Rather than presenting rewards in isolation, this phase transforms today's decisions into tomorrow's context.

---

# Resolution

Once the Main Daily Action has been completed, the game resolves every consequence generated by that action. Examples include player attribute growth, Moment changes, fatigue adjustments, morale changes, philosophy progression, equipment effects, coaching staff improvements, and delayed event triggers. The player immediately understands how today's investment influenced the team.

---

# Immediate vs Delayed Consequences

Not every consequence should occur instantly. Some are immediate, such as fatigue, minor attribute gains, and morale shifts. Others intentionally affect future days, such as developing event chains, upcoming tactical benefits, long-term philosophy growth, and future sponsor opportunities. This distinction makes planning feel meaningful beyond the current day.

---

# Building Tomorrow's Puzzle

The End of Day is not merely a reward screen; it quietly assembles tomorrow's strategic landscape. Today's decisions become tomorrow's constraints, opportunities, and dilemmas, creating the continuous feedback loop at the heart of the game. Preparation never exists in isolation, and every action echoes into future days.

---

# Transition

After all consequences have been resolved, the calendar advances and the player immediately enters a new day. The next interaction is always World Cup Daily, creating a consistent rhythm throughout the entire campaign.

---

# Emotional Rhythm

Every completed day should leave the player with one feeling: **"I wonder what tomorrow will bring."** That anticipation is the emotional bridge connecting consecutive days. If players immediately want to advance one more day, the loop has succeeded.

---

# Design Principles

1. Every action generates visible consequences.

2. Some consequences are immediate; others are intentionally delayed.

3. Today's decisions create tomorrow's puzzle.

4. The End of Day exists to build anticipation, not simply deliver rewards.

5. Every completed day should naturally encourage the player to play one more.

# 4.9 Opportunity Cost

---

# Purpose

Opportunity Cost is the most important design principle governing the Daily Loop. Rather than functioning as an isolated mechanic, it defines how every strategic decision should be evaluated. Whenever the player gains something valuable, they should knowingly sacrifice something else. Without Opportunity Cost, the Daily Loop becomes optimization; with Opportunity Cost, it becomes strategy.

---

# The Central Resource

The Daily Loop is intentionally built around a single finite resource: **Time.** Every day contains exactly one strategic investment, creating permanent scarcity, and scarcity creates prioritization. Prioritization, in turn, creates meaningful gameplay.

---

# Opportunity Cost Is Not Punishment

The purpose of Opportunity Cost is never to punish experimentation; instead, it forces commitment. Good decisions should feel satisfying because they required giving something up, while bad decisions should remain educational rather than frustrating. Players should lose because they misread the context, not because the game arbitrarily removed options.

---

# Opportunity Cost Exists Everywhere

Although the Main Daily Action is its clearest expression, Opportunity Cost exists throughout the game. Examples include Training versus Recovery, Long-term Philosophy versus Immediate Match Preparation, Developing a Young Player versus Preparing a Veteran, Accepting a Sponsor Event versus Following the Original Plan, and Aggressive Tactics versus Conserving Energy. Every meaningful system should ultimately reduce to: > "What am I willing to sacrifice?"

---

# The Illusion of Unlimited Choice

Players may inspect every system, read every report, review every player, and experiment with every tactical adjustment; however, they can never execute every desirable action. The game deliberately separates Freedom of Thought from Freedom of Action. Thinking is unlimited; time is not.

---

# Evaluating New Mechanics

Whenever a future gameplay system is proposed, designers should ask: Does this mechanic introduce a meaningful trade-off? If the answer is no, the mechanic should probably be redesigned. Opportunity Cost is therefore not only a gameplay mechanic but also a design filter.

---

# Design Principles

1. Time is the primary scarce resource.

2. Every strategic investment excludes another.

3. Opportunity Cost creates meaningful decisions.

4. The player sacrifices options, not freedom.

5. Every future gameplay mechanic should reinforce this principle.

---

# 4.10 Daily Loop Design Principles

---

The Daily Loop is governed by a small number of permanent design laws, and these principles should remain true regardless of how many systems are added in the future.

---

## Principle 1

Every new day presents a different strategic puzzle, and the player should never feel they are repeating yesterday's solution.

---

## Principle 2

Information always precedes decision making, so players should understand today's context before committing resources.

---

## Principle 3

Preparation is gameplay, and planning should feel as engaging as football matches.

---

## Principle 4

Every important decision has an opportunity cost; if no sacrifice exists, meaningful strategy disappears.

---

## Principle 5

No dominant daily action may exist, and the optimal choice must always depend on context.

---

## Principle 6

Events exist to transform today's puzzle; they are not reward dispensers.

---

## Principle 7

The player adapts to changing circumstances, and mastery comes from judgement, never from memorization.

---

## Principle 8

Today's decisions build tomorrow's problems, making the campaign a continuous chain of consequences.

---

## Principle 9

The structure remains constant while the context constantly changes; consistency creates clarity, and variation creates replayability.

---

## Principle 10

Every completed day should naturally encourage playing one more, and the player should constantly feel: > "Let's see what tomorrow brings."

---

# 4.11 Complete Daily Example

---

The following example illustrates how all Daily Loop systems interact during normal gameplay.

---

## Day Begins

The player enters Day 14.

---

## World Cup Daily

Headline: "Cabo Verde prepares for decisive match against Japan." Additional news includes heavy rain expected, Carlos Mendes continuing excellent form, Japan losing its starting centre-back through suspension, and Brazil qualifying for the Round of 16. The player immediately understands today's context.

---

## Event Resolution

Heavy Rain reduces training effectiveness by 40% and makes Indoor Tactical Session available, immediately changing the player's priorities.

---

## Management

The player reviews fatigue, checks Carlos Mendes' excellent Moment, inspects Japan's tactical tendencies, changes formation, equips new boots on the striker, and reviews philosophy progression. Time remains frozen.

---

## Main Daily Action

The player has several possibilities: Recovery, Training, Indoor Tactical Session, and Sponsor Opportunity. After evaluating the situation, the player chooses Indoor Tactical Session, and the day advances.

---

## Consequences

Philosophy progression increases, players recover slightly less than expected, team understanding improves, and tomorrow's match preparation receives a bonus.

---

## Advance Day

The calendar advances, and the player immediately returns to World Cup Daily. A new strategic puzzle begins.

---

# Daily Loop Summary

The player never solved a mathematical optimization problem; instead, they interpreted information, prioritized problems, accepted opportunity cost, committed to a decision, experienced consequences, and prepared for tomorrow. This is the intended gameplay experience of every preparation day throughout the project.

# Chapter 5 — Team Philosophy

## Purpose

The Team Philosophy system defines the long-term football identity of the national team throughout a World Cup run. Unlike tactical adjustments, which respond to the needs of a single match, Philosophy represents a strategic direction that evolves over multiple days and gradually transforms how the team behaves on the pitch. It acts as the bridge between preparation and matches, ensuring that decisions made outside the field have visible consequences during gameplay. The objective of this system is not to provide passive statistical bonuses; instead, it changes the type of football experienced by the player.

---

## Design Philosophy

Traditional football games usually represent tactical styles through hidden modifiers. A possession style may simply increase pass accuracy, while an aggressive style may improve pressing efficiency. This project intentionally avoids that approach. A philosophy should not merely change percentages; it should change the situations the player experiences during matches. Choosing High Press should result in a completely different type of football than choosing Deep Defensive Block. The player should recognize the team's identity simply by playing, even without reading a single statistic. For this reason, Philosophy is treated as a gameplay generator rather than a balance modifier.

---

## Philosophy vs Tactical Adjustments

One of the most important distinctions in the project is separating long-term identity from short-term adaptation. **Team Philosophy** represents the football identity built throughout the tournament; it evolves slowly, requires continuous investment and influences the type of sequences generated during matches. **Tactical Adjustments** represent temporary decisions made before or during individual matches, allowing adaptation to specific opponents without redefining the team's overall identity. For example, a High Press team may temporarily defend deeper against France, but its philosophy remains High Press. Likewise, a Possession-oriented team may choose a more direct approach during the final minutes of a match without abandoning its long-term identity. This separation prevents players from completely reinventing the team before every fixture while still allowing meaningful tactical flexibility.

---

## Philosophy Progression

At the beginning of every World Cup run, the player chooses a Team Philosophy (High Press, Possession, Counter Attack or Defensive Block). This choice represents the team's initial football doctrine rather than a fixed tactical build.

Each philosophy defines:

- Its preferred football identity.
- Two natural Principles that best represent that philosophy.
- A unique pool of football sequences and match situations.
- Exclusive basic Traits available at the beginning of the run.

The chosen philosophy establishes the team's starting direction but never restricts future development. Throughout the tournament, the player is free to evolve the team into increasingly unique interpretations of that football identity.

---

## Principles

Principles are the fundamental pillars used to shape the team's football behaviour.

The five Principles are:

- Pressure
- Build-up
- Verticality
- Solidity
- Direct Play

Unlike traditional progression systems, Principles do not grant statistical bonuses.

Every point invested into a Principle continuously changes how the team naturally behaves during matches.

Examples include:

- Where possession is recovered.
- How quickly attacks progress.
- Whether the team prefers central or wide progression.
- The average duration of possessions.
- Defensive positioning after losing the ball.

Every investment is immediately reflected through gameplay, even if only subtly.

The objective is that every tactical session slightly changes the football experienced by the player.

---

## Philosophy Progress

Although every Principle can be developed freely, each philosophy has two Principles that naturally reinforce its doctrine.

For example:

- High Press → Pressure + Verticality
- Possession → Build-up + Pressure
- Counter Attack → Solidity + Verticality
- Defensive Block → Solidity + Direct Play

Investing in these preferred Principles increases Philosophy Progress more efficiently.

As Philosophy Progress increases, the philosophy gains Levels representing how consolidated the team's football identity has become.

---

## Philosophy Levels

Philosophy Levels do not increase player statistics.

Instead, they strengthen the expression of the team's football identity.

Each new level may:

- Increase the frequency of philosophy-specific sequences.
- Generate deeper and more elaborate football situations.
- Allow more complex tactical behaviours to emerge naturally.
- Award one Identity Point.

A Level I philosophy represents a team learning its ideas.

A Level II philosophy represents a recognizable football identity.

A Level III philosophy represents a fully consolidated style capable of consistently expressing its intended football.

---

## Identity Points

Whenever the Team Philosophy reaches a new Level, the player earns one Identity Point.

Identity Points are a strategic resource used to permanently acquire Traits.

Identity Points are intentionally scarce.

Choosing one Trait means delaying or abandoning others, ensuring that every run develops a unique football identity.

---

## Traits

Traits represent consolidated football ideas permanently adopted by the team.

Unlike Principles, which continuously influence behaviour, Traits introduce recognizable tactical concepts that further specialize the team's style.

Traits never function as simple numerical bonuses.

Instead, they modify priorities, decision-making and the types of situations the team naturally attempts to create during matches.

Examples include:

- Dominating central areas.
- Intensifying counter-pressing.
- Prioritising second balls.
- Creating overloads.
- Stretching the opposition.

The purpose of a Trait is not to make the team objectively stronger, but to make it play more distinctly.

---

## Trait Progression

Traits are divided into four tiers.

- Basic
- Intermediate
- Advanced
- Master

Higher-tier Traits represent increasingly sophisticated football concepts rather than simply stronger upgrades.

To unlock a Trait, four requirements must be satisfied:

1. The required previous Trait within its conceptual branch.
2. The required Principle distribution.
3. The required Philosophy Level.
4. One available Identity Point.

This structure ensures that every advanced tactical concept feels earned through long-term team development rather than immediate progression.

---

## Sequence Generation

The Team Philosophy determines the football ecosystem from which match sequences are generated.

Principles continuously influence how the team behaves inside that ecosystem.

Traits further specialize that behaviour by introducing permanent tactical priorities.

As a result:

- Philosophy defines **what type of football exists**.
- Principles define **how the team naturally behaves**.
- Traits define **which football ideas become permanent parts of the team's identity**.

Together, these three layers create a progression system where the player's decisions are expressed through football itself rather than through hidden statistical modifiers.

---

## Design Principle

Every permanent progression inside the Philosophy system must answer one question:

> **"Does this change how my team plays football?"**

If the answer is no, it does not belong in the Philosophy system.

## Interaction with Other Systems

The Philosophy system interacts continuously with almost every major gameplay system. Events may temporarily strengthen or weaken philosophy development, Coaching Staff influences how efficiently the philosophy evolves, Player Moment affects how consistently footballers execute the team's identity, Tactical Adjustments adapt the philosophy to specific opponents without replacing it, Match performance validates whether the current philosophy is functioning correctly, and player progression allows individuals to better express the team's football identity over time. Rather than existing as an isolated mechanic, Philosophy acts as a central node connecting preparation and match gameplay.

---

## Player Experience

Throughout a run, the player should gradually stop thinking about individual tactical bonuses and instead begin recognizing the team's identity intuitively. Desired thoughts include:

* "We're finally winning the ball high up the pitch consistently."
* "Our build-up feels much cleaner than it did in the first match."
* "This team really plays the football I wanted."
* "Changing philosophy now would require rebuilding everything."

When players naturally describe their team using football language instead of numerical modifiers, the system has achieved its objective.

---

## Future Expandability

The Philosophy framework has been intentionally designed to support future expansions without modifying its core principles. Future versions may introduce hybrid philosophies, advanced tactical identities, asymmetric systems or manager-specific specializations. Regardless of future additions, one rule should remain immutable:

> **A philosophy must always change the football experienced by the player before it changes numerical performance.**

---

## Design Principles

The Team Philosophy system establishes the following permanent design rules:

1. Philosophy represents long-term football identity rather than short-term tactics.
2. Philosophy progresses gradually throughout the tournament.
3. Philosophy primarily changes the type of sequences generated during matches instead of acting as a hidden statistical modifier.
4. Every philosophy possesses visible strengths and weaknesses.
5. Tactical Adjustments complement Philosophy but never replace it.
6. Players should recognize the team's identity by playing, not by reading interface values.
7. The success of a philosophy should emerge naturally through gameplay rather than explicit numerical feedback.

# Chapter 6 — Player Progression

## Purpose

The Player Progression system defines how footballers evolve during a single World Cup run. Unlike career management games, progression is intentionally short-term and narrative-driven. The objective is not to transform average players into world-class superstars over dozens of seasons, but to create believable growth that reinforces the unique story of each tournament.

Progression therefore exists to support emergent storytelling rather than long-term grinding.

---

## Design Philosophy

The system is built around one central principle:

> **Players develop stories before they develop statistics.**

Traditional progression systems encourage players to chase increasingly larger numerical values. While satisfying in RPGs, that approach weakens the emotional identity of a World Cup, where real players rarely become dramatically stronger within a single month.

Instead, the project models two different forms of progression:

* Permanent Growth, representing actual football development.
* Moment, representing temporary form, confidence and momentum.

Together, these systems allow players to experience believable evolution while preserving the emotional unpredictability of tournament football.

---

## Permanent Growth

Permanent Growth represents lasting improvements achieved during the current run. These improvements remain until the tournament ends but never carry into future runs.

Growth may originate from several gameplay systems, including Training, Equipment, Coaching Staff, Mentor Events and rare special opportunities.

Unlike Moment, Permanent Growth evolves slowly. Players should feel improvement across the tournament without ever becoming unrecognizable versions of themselves.

The design intentionally avoids exaggerated attribute inflation. A modest improvement that meaningfully changes how a player performs is preferable to dramatic numerical growth.

Permanent attributes never decrease during a run. Temporary declines are represented exclusively through Moment.

---

## Moment

Moment represents the player's current competitive state.

Rather than describing technical ability, it reflects how well that footballer is performing right now.

Moment is influenced by confidence, morale, recent performances, pressure, inspiration, fatigue and tournament momentum.

Unlike Permanent Growth, Moment fluctuates constantly throughout the competition.

A player may become "on fire" after several outstanding performances or gradually lose confidence following repeated mistakes.

Because Moment changes frequently, it becomes one of the most dynamic systems in the game.

---

## Permanent Growth vs Moment

Separating these systems solves several design problems simultaneously.

Permanent Growth rewards long-term planning and investment.

Moment rewards good performance and emotional management.

This distinction allows players to experience dramatic tournament narratives without permanently altering footballers beyond believable limits.

For example, a striker may only improve slightly in Finishing through training while simultaneously entering an exceptional run of form thanks to recent goals. During that period, the player feels significantly more dangerous without requiring unrealistic attribute increases.

Likewise, an experienced star may retain excellent attributes while temporarily struggling due to poor confidence.

This dual progression captures football more naturally than attribute growth alone.

---

## Sources of Permanent Growth

Although balancing belongs to later documents, the sources of growth are intentionally diverse.

Training develops technical ability.

Equipment enhances player potential.

Coaching Staff improves learning efficiency.

Mentor Events accelerate development.

Rare Opportunities provide unique progression paths.

Each source represents a different strategic investment during preparation.

No single system should dominate player development.

---

## Sources of Moment

Moment evolves primarily through gameplay.

Examples include:

* Strong individual performances.
* Goals.
* Assists.
* Match-winning actions.
* Costly mistakes.
* Missed penalties.
* Clean sheets.
* Successful tactical execution.
* Team morale.
* Certain events.

This makes every match emotionally meaningful beyond the final score.

Players are constantly writing their own tournament story.

---

## The Player Story

One of the primary objectives of the progression system is allowing footballers to become memorable characters during a run.

A player should never simply become "better."

Instead, they should become something.

Examples include:

The revelation of the tournament.

The team's defensive leader.

The clutch goalscorer.

The playmaker everything flows through.

The goalkeeper who saves decisive penalties.

These identities emerge naturally from gameplay rather than scripted events.

Importantly, they remain dynamic.

A player who begins the tournament brilliantly may lose momentum later, allowing another teammate to become the new protagonist.

This prevents narratives from becoming static.

---

## Difficulty and Progression

National team selection remains the primary source of difficulty.

France begins with stronger footballers than Cabo Verde.

This difference should remain meaningful throughout the tournament.

Progression exists to improve each squad within its own competitive context rather than equalizing every nation.

Choosing a weaker nation therefore means embracing a more demanding journey, not simply investing additional time into training.

This distinction preserves both replayability and national identity.

---

## Interaction with Match Gameplay

Player progression influences matches in several interconnected ways.

Permanent attributes determine the footballer's long-term quality.

Moment determines current performance consistency.

Together they influence the execution of football actions, the reliability of decisions during key sequences and the player's overall contribution to the team's philosophy.

Most importantly, progression should be felt before it is measured.

Players should notice that a footballer feels more reliable, more dangerous or more influential before opening a statistics panel confirming the improvement.

The emotional perception of growth is more valuable than the numerical confirmation.

---

## Interaction with Team Philosophy

Progression is never isolated from Philosophy.

As footballers improve, they become increasingly capable of expressing the team's tactical identity.

Likewise, a consolidated philosophy allows players to perform closer to their potential.

This relationship reinforces one of the project's central ideas:

Individual development and collective identity should evolve together.

Neither system should overshadow the other.

---

## MVP Scope

The initial release intentionally limits progression to systems that produce the greatest gameplay value.

Included:

* Permanent Growth
* Moment
* Team Morale
* Coaching Staff Progression

Deferred for future versions:

* Individual relationships between players.
* Pair chemistry.
* Long-term careers.
* Seasonal development.

This scope keeps the system focused while preserving room for future expansion.

---

## Design Principles

The Player Progression system follows the following permanent rules:

1. Players develop stories before they develop statistics.
2. Permanent Growth is gradual and believable.
3. Moment is dynamic and reflects current form rather than technical ability.
4. Permanent attributes never decrease during a run.
5. Match performances should influence Moment more than isolated menu actions.
6. National team difficulty should remain meaningful throughout the tournament.
7. Progression should be felt through gameplay before it is observed numerically.
8. Individual progression and Team Philosophy should reinforce each other rather than compete.

# Chapter 7 — Match Design

## Purpose

The Match Design system transforms all preparation decisions into interactive football gameplay. While the Daily Loop is responsible for creating strategic context, the Match validates whether the player's preparation was capable of generating meaningful opportunities on the pitch.

The match is therefore not an isolated minigame.

It is the culmination of every strategic decision made throughout the tournament.

The objective is making players feel that preparation created the football they are about to experience, while execution determines whether they can capitalize on those opportunities.

---

## Design Philosophy

The project intentionally rejects two traditional approaches to football games.

The first is simulating the entire ninety minutes under full player control.

The second is resolving the entire match automatically through management simulation.

Instead, the match focuses exclusively on decisive football moments.

The player experiences only the sequences that truly matter.

Everything else is simulated.

This approach keeps matches fast, emotionally intense and tightly connected to preparation.

Every interactive sequence should feel important.

Every mistake should matter.

Every successful play should feel earned.

---

## The Relationship Between Preparation and Matches

Preparation does not directly determine victory.

Instead, it determines the football available to the player.

Good preparation produces:

* More opportunities.
* Better quality opportunities.
* Situations aligned with the team's philosophy.
* Better prepared footballers.

Poor preparation produces:

* Fewer opportunities.
* More defensive sequences.
* Greater execution difficulty.
* Tactical disadvantages.

The match therefore answers a single question:

> **"Can the player convert preparation into results?"**

Preparation creates possibility.

Execution creates success.

---

## Match Flow

Every match follows the same high-level structure.

```text
Pre-Match Briefing

↓

Live Match Simulation

↓

Key Sequence

↓

Live Match Simulation

↓

Key Sequence

↓

...

↓

Final Whistle

↓

Post-Match Summary
```

This rhythm intentionally mirrors real football.

Most of the game is observed.

Only decisive moments become interactive.

This prevents repetition while preserving tension.

---

## Live Match Simulation

Between interactive sequences, the player observes a condensed simulation of the match.

The objective is maintaining the sensation that the entire match continues to exist beyond the moments under direct control.

During simulation, the interface displays:

* Current score.
* Match clock.
* Possession.
* Momentum.
* Shots.
* Match statistics.
* Contextual commentary.

The simulation should feel alive without demanding constant attention.

---

## Commentary

Commentary exists primarily as a communication system rather than entertainment.

Its purpose is explaining how the match evolves between sequences.

Examples include:

> "Mbappé receives the ball but quickly loses possession."

> "Japan dominates possession during the last minutes."

> "Uruguay begins pressing much higher."

Only meaningful moments should be reported.

The player should never feel overwhelmed by unnecessary text.

The commentary provides context.

The sequences provide gameplay.

---

## Match Management

While observing the simulation, the player may temporarily pause to perform match-specific adjustments.

Available actions include:

* Substitutions.
* Formation changes.
* Tactical instructions.
* Positional adjustments.
* Player condition review.

Preparation systems remain unavailable.

The player cannot:

* Train players.
* Change equipment.
* Progress philosophy.
* Manage long-term systems.

The match should remain focused entirely on football.

---

## Key Sequences

Key Sequences are the core gameplay unit of every match.

Rather than controlling ninety continuous minutes, the player directly participates only during decisive situations.

Each match generates approximately two to six sequences.

The exact number depends on:

* Team preparation.
* Team philosophy.
* Philosophy development.
* Opponent.
* Match context.

Preparation therefore determines how many meaningful opportunities the player receives.

---

## Sequence Generation

Sequences are generated dynamically before and throughout the match.

Generation considers four primary factors:

1. The player's philosophy.
2. The opponent's philosophy.
3. The current development level of both philosophies.
4. The evolving match context.

Dynamic context includes:

* Current score.
* Match minute.
* Player fatigue.
* Team Moment.
* Red cards.
* Weather.
* Match momentum.
* Previous sequences.

This ensures that every match evolves naturally instead of following scripted patterns.

---

## Philosophy as a Football Generator

One of the defining innovations of the project is that philosophy changes the football itself.

High Press naturally generates sequences involving:

* High recoveries.
* Pressing traps.
* Defensive transitions.
* Long-ball duels.
* Physically demanding situations.

Possession naturally generates:

* Controlled build-up.
* Passing triangles.
* Positional attacks.
* Midfield overloads.
* Progressive circulation.

Counter Attack emphasizes:

* Defensive recoveries.
* Fast transitions.
* Numerical superiority.
* Direct attacks.

The player should immediately recognize the team's identity simply by experiencing these situations.

---

## Sequence Structure

Every Key Sequence represents a miniature football story.

Rather than presenting a single isolated action, each sequence follows an escalating structure.

```text
Situation

↓

Decision

↓

Football Action

↓

Reaction

↓

Decision

↓

Football Action

↓

Climax

↓

Outcome
```

This creates emotional pacing inside every sequence.

Some sequences may end quickly.

Others develop into longer attacking moves.

The player should never know which type of sequence is beginning.

---

## Variable Length

Not every sequence should last equally long.

Some may consist of only a single decisive duel.

Others may evolve into multiple connected football actions.

This variability creates uncertainty and prevents players from predicting when a sequence will end.

As a result, every sequence feels unique.

---

## Football Actions

Football Actions are the smallest interactive gameplay elements.

Examples include:

* Pass.
* First Touch.
* Dribble.
* Press.
* Tackle.
* Header.
* Shot.
* Save.

These actions function as reusable building blocks.

Complex football situations emerge from combining simple actions rather than designing completely unique interactions for every scenario.

This modular design significantly increases gameplay variety while simplifying future expansion.

---

## Failure and Recovery

One of the project's most important design principles is preserving football continuity.

Mistakes should rarely terminate a sequence immediately.

Instead, failure often creates a new situation.

Examples include:

A failed pass may become a loose ball.

A missed tackle may force emergency defending.

A blocked shot may create a rebound.

Football rarely ends after one mistake.

The gameplay should reflect that reality.

This makes sequences feel fluid instead of binary.

---

## Match End

At the final whistle, the player receives a structured summary.

The summary includes:

* Match result.
* Match statistics.
* Player performances.
* Moment changes.
* Philosophy progression.
* Emerging tournament stories.
* Updated group standings.

The player then returns directly to the Daily Loop.

Every consequence generated by the match becomes tomorrow's strategic context.

This closes the complete gameplay cycle.

---

## Player Experience

Throughout a match, the player should continuously alternate between observation and intervention.

Observation creates anticipation.

Interactive sequences create tension.

Successful execution creates satisfaction.

The return to simulation allows emotional recovery before the next decisive moment.

This rhythm prevents fatigue while maintaining excitement throughout the entire tournament.

---

## Design Principles

The Match Design system follows the following permanent rules:

1. Matches validate preparation rather than replace it.
2. The player only controls decisive football moments.
3. Preparation determines opportunities; execution determines results.
4. Philosophy changes the football experienced before modifying hidden statistics.
5. Key Sequences are miniature football stories rather than isolated minigames.
6. Football Actions are modular building blocks that combine into larger situations.
7. Mistakes should generate new football problems rather than immediately ending gameplay.
8. Every completed match must naturally feed information back into the Daily Loop, reinforcing the continuous relationship between preparation and execution.

# Chapter 8 — Dynamic Storytelling

## Purpose

Dynamic Storytelling is the system responsible for transforming a sequence of gameplay decisions into memorable football narratives. Unlike scripted campaigns, the objective is not to tell a predefined story. Instead, the game creates the conditions for stories to emerge naturally through the interaction of gameplay systems.

Winning the World Cup remains the primary objective of every run. However, the emotional value of the experience comes from remembering *how* that tournament unfolded rather than simply remembering the final result.

This chapter defines the principles that allow every World Cup to feel unique without relying on scripted content.

---

## Design Philosophy

The project follows one fundamental storytelling principle:

> **The game creates situations. The player creates the story.**

The narrative is therefore not authored through cutscenes or dialogue trees.

It emerges from preparation, matches, events, player progression, philosophy development and tournament context interacting over time.

Every system described in previous chapters contributes to storytelling. Dynamic Storytelling simply connects those outcomes into experiences players naturally remember.

---

## Emergent Narrative

Every run should gradually answer questions such as:

* Who became the hero of this World Cup?
* Which decision changed the tournament?
* What unexpected event forced a new strategy?
* How did the team's identity evolve?
* Which match became unforgettable?

These answers should never be predetermined.

Two identical runs using the same nation should still produce different stories because the underlying systems continuously generate different contexts.

---

## The Story Arc of a Run

A typical tournament should naturally progress through four narrative stages.

### The Beginning

The player inherits an unfinished team with an undefined story.

The focus is understanding the squad, identifying strengths and weaknesses, and establishing the first elements of the team's football identity.

The tournament feels uncertain.

---

### The Development

Events accumulate.

Players improve.

The philosophy becomes recognizable.

Important victories and defeats begin shaping expectations.

The player starts recognizing recurring protagonists.

The team begins feeling like *their* team.

---

### The Climax

Knockout matches concentrate every previous decision.

Preparation, philosophy, player Moment and accumulated consequences now matter more than ever.

This is where the strongest emotional stories should emerge.

Unexpected heroes.

Tournament-defining saves.

Last-minute goals.

Risky tactical decisions.

---

### The Resolution

Regardless of winning or losing, the tournament concludes by showing the consequences of the journey.

The player should leave remembering moments rather than statistics.

The objective is creating the feeling:

> "That was an incredible World Cup."

rather than:

> "My striker reached 86 Overall."

---

## Player Stories

Individual footballers represent the strongest source of emotional attachment.

Throughout the tournament, players should gradually acquire identities created by gameplay.

Examples include:

* The revelation of the tournament.
* The captain who inspired the team.
* The goalkeeper who repeatedly saved elimination.
* The substitute who unexpectedly became indispensable.
* The young prospect who exceeded expectations.

These identities emerge naturally from match performances, Moment, events and preparation.

The game should acknowledge these stories, but never script them.

---

## Team Stories

The national team itself also develops an evolving identity.

Examples include:

A defensive underdog surviving against stronger opponents.

A possession-based team gradually mastering its philosophy.

An aggressive pressing team exhausting opponents throughout the tournament.

A squad overcoming repeated injuries through tactical adaptation.

The player's memory should focus as much on the team's evolution as on individual footballers.

---

## Tournament Stories

The World Cup should feel alive independently of the player's own campaign.

Major tournament events contribute to this sensation.

Examples include:

* A traditional favorite eliminated during the group stage.
* A small nation reaching the semifinals.
* A legendary striker suffering an early injury.
* Unexpected tactical trends emerging across the tournament.

These stories provide context without overwhelming the player with unnecessary information.

The World Cup should feel larger than the player's own team.

---

## Storytelling Through Systems

Every major gameplay system contributes to storytelling.

The Daily Loop introduces new narrative possibilities.

Events create unexpected turning points.

Player Progression creates protagonists.

Moment creates emotional highs and lows.

Team Philosophy creates identity.

Matches create memorable moments.

No dedicated narrative system should replace these interactions.

The strongest stories emerge precisely because they were not explicitly scripted.

---

## Story Recognition

Although stories emerge organically, the game should periodically acknowledge them.

Examples include:

* Match summaries highlighting outstanding performances.
* Daily headlines referencing recent achievements.
* Commentary reacting to player form.
* Post-match reports recognizing tactical evolution.
* Tournament summaries emphasizing important milestones.

Recognition reinforces emotional attachment without forcing linear storytelling.

---

## Emotional Memory

One of the project's principal design objectives is maximizing long-term memory.

Several months after completing a run, players should still remember specific moments.

Examples include:

"I survived the quarterfinal because my goalkeeper saved two penalties."

"My unknown striker finished as the tournament revelation."

"A storm completely changed my preparation before the semifinal."

"My philosophy finally clicked during the knockout stage."

These memories should arise naturally from gameplay rather than cinematic presentation.

---

## Replayability Through Storytelling

Dynamic Storytelling is one of the project's primary replayability systems.

Because every run generates different:

* Events.
* Match sequences.
* Player performances.
* Philosophy progression.
* Tournament developments.

the resulting narrative also changes.

Replayability therefore emerges from new stories rather than simply new statistics.

Players should replay the game to experience another World Cup, not merely to optimize another build.

---

## MVP Scope

For the initial release, Dynamic Storytelling intentionally remains systemic rather than cinematic.

Included:

* Emergent player stories.
* Team identity.
* Tournament headlines.
* Match summaries.
* Moment recognition.
* Philosophy evolution.

Deferred for future versions:

* Press conferences.
* Social media simulation.
* Complex media narratives.
* Long-term historical records.
* Persistent player careers.

The MVP focuses exclusively on gameplay-driven storytelling.

---

## Design Principles

Dynamic Storytelling follows the following permanent rules:

1. Stories emerge from gameplay systems rather than scripted events.
2. The game creates situations; the player creates the narrative.
3. Individual footballers should naturally become memorable characters.
4. Team identity should evolve alongside player development.
5. The World Cup must feel alive beyond the player's own matches.
6. Systems should recognize important stories without forcing them.
7. Players should remember moments before remembering statistics.
8. Replayability should come from experiencing different tournaments rather than repeating identical gameplay with different numbers.

# Chapter 9 — MVP Scope & Design Laws

## Purpose

This chapter defines the boundaries of the Minimum Viable Product (MVP) and establishes the permanent design laws governing the future evolution of the project.

The objective of the MVP is not to build every imaginable football management system.

The objective is to build the smallest possible version capable of fully delivering the project's core fantasy.

Every future feature should therefore be evaluated against two questions:

* Does it reinforce the Core Gameplay?
* Is it necessary for Version 1.0?

If the answer to either question is "no", the feature should be postponed.

Maintaining a focused MVP is considered more valuable than implementing a large number of disconnected systems.

---

# MVP Vision

The MVP should already deliver the complete gameplay loop.

A player should be able to:

* Choose a national team.
* Play an entire World Cup.
* Prepare the squad every day.
* Build a football philosophy.
* Experience dynamic events.
* Play decisive match sequences.
* Develop memorable player stories.
* Win or lose the tournament.
* Immediately want to begin another run.

If these goals are achieved, the project has successfully validated its core gameplay.

Everything else becomes expansion.

---

# MVP Systems

The following systems are considered part of Version 1.0.

## Core Structure

* National Team Selection.
* World Cup Tournament.
* Daily Loop.
* Match Loop.
* Complete Run Structure.

These systems define the backbone of the experience.

---

## Preparation

* World Cup Daily.
* Event System.
* Squad Management.
* Tactical Adjustments.
* Formation Management.
* Main Daily Actions.
* Opportunity Cost.

These systems create the strategic layer.

---

## Team Identity

* Team Philosophy.
* Philosophy Progression.
* Coaching Staff Progression.
* Team Morale.

These systems define how the team evolves collectively.

---

## Player Systems

* Permanent Growth.
* Moment.
* Equipment.
* Player Stories.

These systems define individual evolution.

---

## Match Gameplay

* Live Match Simulation.
* Dynamic Commentary.
* Key Sequence Generation.
* Football Actions.
* Tactical Adjustments During Matches.
* Post-Match Summary.

These systems define the interactive football experience.

---

## Storytelling

* Emergent Stories.
* Tournament Headlines.
* Match Summaries.
* Team Identity.
* Tournament Progression.

These systems transform gameplay into memorable narratives.

---

# Systems Explicitly Deferred

The following ideas have intentionally been excluded from Version 1.0.

Their exclusion is not due to lack of value.

Instead, they were postponed because they are not essential for validating the core gameplay.

Examples include:

* Player chemistry between specific pairs.
* Long-term careers.
* Multi-season progression.
* Press conferences.
* Social media simulation.
* Transfer market.
* Club management.
* Historical databases.
* Extensive media systems.
* Persistent football universe.
* Advanced sponsorship systems.
* Detailed financial management.
* Complex scouting networks.

These systems may significantly enrich future versions but should not distract development during the MVP.

---

# Expansion Philosophy

Future mechanics should emerge naturally from existing systems rather than replacing them.

For example:

A future media system should strengthen Dynamic Storytelling.

A sponsorship system should generate new Opportunity Events.

An academy system should reinforce Player Progression.

Every new mechanic should connect to existing gameplay loops instead of creating parallel ones.

This philosophy keeps the project coherent as it grows.

---

# Design Laws

The following principles are considered permanent.

Future systems should never violate them.

## Law 1 — Preparation Is Gameplay

Preparation must always be as engaging as matches.

If a preparation system becomes routine, it should be redesigned.

---

## Law 2 — Every Decision Has Opportunity Cost

Meaningful gameplay only exists when choosing one option requires sacrificing another.

Whenever a mechanic removes meaningful trade-offs, it weakens the project.

---

## Law 3 — Context Creates Replayability

Replayability comes from changing circumstances rather than changing rules.

The structure remains stable.

The context constantly evolves.

---

## Law 4 — Philosophy Changes Football

A football philosophy should primarily change the situations experienced during matches.

Hidden numerical bonuses are secondary.

Players should feel the philosophy before measuring it.

---

## Law 5 — Stories Before Statistics

Players should remember tournaments through moments, protagonists and decisions.

Statistics exist to reinforce those memories.

They never replace them.

---

## Law 6 — Adaptation Beats Optimization

The game should reward understanding the current situation rather than following predetermined strategies.

Whenever players discover one universally optimal solution, gameplay depth decreases.

---

## Law 7 — The World Must Feel Alive

The tournament should continue evolving independently of the player's own team.

Opponents improve.

Favorites fail.

Underdogs surprise.

The player participates in a living World Cup rather than occupying its center.

---

## Law 8 — Execution Complements Preparation

Preparation should generate opportunities.

Execution should determine whether those opportunities become success.

Neither layer should dominate the other.

Removing either preparation or execution should noticeably reduce the quality of the experience.

---

## Law 9 — Systems Must Reinforce Each Other

No gameplay system should exist in isolation.

Events influence preparation.

Preparation develops philosophy.

Philosophy changes matches.

Matches influence players.

Players change future preparation.

The project is intentionally built as a network of interconnected systems.

---

## Law 10 — Every Run Must Tell a Different Story

This is the ultimate design objective.

If two completed World Cup runs feel identical, the project has failed regardless of technical quality.

The player's memories should be defined by:

Unexpected heroes.

Difficult sacrifices.

Tournament-defining moments.

A unique football identity.

Winning the World Cup should feel rewarding.

Remembering how it happened should feel unforgettable.

---

# Design Validation Checklist

Whenever a new feature is proposed during development, it should be evaluated using the following checklist.

* Does it reinforce the Daily Loop?
* Does it create meaningful decisions?
* Does it generate opportunity cost?
* Does it strengthen Team Philosophy?
* Does it interact with existing systems?
* Does it increase replayability through context rather than repetition?
* Does it contribute to emergent storytelling?
* Does it preserve the balance between preparation and execution?

If most answers are negative, the feature should not become part of the project.

---

# Final Design Statement

The objective of this project is not to simulate football with maximum realism.

Neither is it to transform football into a traditional roguelike.

Its objective is to create a new type of football strategy game where every World Cup becomes an emergent story built through meaningful preparation, decisive execution and constant adaptation.

Every system described throughout this document ultimately serves that single purpose.

Whenever future development creates uncertainty, this statement should be considered the project's final source of truth.

// prompt para optimizar cada capitulo: Cambio de formato sin cambiar contenido: los .md estan quedando con muchas lineas. No digo que le pongas menos informacion solo considera redactar oraciones en la misma linea en vez de separar la misma idea en varias lineas.