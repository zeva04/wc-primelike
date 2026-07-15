WC 2026 GAME
Game Vision Document v2.0
Document Type: Vision Bible (Cover)
Status: Draft
Language: English
Audience: Internal Design Team
Tagline
Survive the chaos. Forge a philosophy. Make history.
Purpose
This document is the authoritative vision for WC 2026 GAME. It defines the player
fantasy, design philosophy and non-negotiable principles that guide every future
design decision. It focuses on WHY before HOW.
Document Structure
• 01 — Vision
• 02 — World & Campaign
• 03 — Core Gameplay
• 04 — Systems Bible
• 05 — Content Bible
• 06 — UX Principles
• 07 — Live Roadmap
North Star
“Every World Cup should feel like a unique story born from the player's decisions.”


Chapter 01 — Vision
Purpose
This chapter defines the immutable creative vision of WC 2026 GAME. It explains why
the game exists, the experience it must deliver, and the principles that every future
design decision must protect.
High Concept
WC 2026 GAME is a strategy roguelike set during the FIFA World Cup. Players lead a
national team through an unpredictable tournament where preparation, adaptation
and decisive moments matter more than perfect simulation. Football is the theme; the
roguelike is the heart.
Vision Statement
The game is not about recreating football. It is about recreating the emotional
experience of coaching a national team through the most chaotic tournament in the
world.
Player Fantasy
Players should feel like a national team coach who survives uncertainty, develops a
football identity, adapts under pressure and creates memorable World Cup stories.
North Star
Survive the chaos. Forge a philosophy. Make history.
Every feature must reinforce at least one part of this statement.
Why This Game Exists
Sports management games often emphasize realism while roguelikes emphasize
systemic storytelling. WC 2026 GAME exists to merge the emotional highs of football
with the replayability and emergent narratives of modern roguelikes without becoming
either a full simulation or an arcade football game.
Design Pillars
• Decisions are the gameplay.
• Preparation is as exciting as the match.
• Every run tells a different story.
• The player's philosophy matters more than collecting stars.
• Skill complements preparation instead of replacing it.
• The world evolves independently of the player.
Emotional Pillars
Preparation: anticipation, curiosity, ownership.
Match: tension, responsibility, epic moments.
Campaign: adaptation, attachment, discovery.
Ending: reflection and storytelling.


Anti-Goals
The project must not become:
• Football Manager Lite.
• FIFA Career Mode.
• A statistics optimizer.
• A collection of disconnected minigames.
• A content-heavy game with weak systems.
Success Criteria
After a run, players should naturally say things such as:
'I shouldn't have risked my striker.'
'That young substitute became the hero.'
'This philosophy actually worked.'
'I want to try a completely different run.'
Design Philosophy
Systems should create stories. Content should support systems, not replace them.
Whenever possible, systemic solutions are preferred over handcrafted one-off content.
One Sentence Test
'A football roguelike where every World Cup becomes a unique story born from the
player's decisions.'
Glossary
Run: One complete World Cup campaign.
Philosophy: The evolving strategic identity of the team.
Conflict: A decision with meaningful trade-offs.
Event: A world occurrence outside player control.
Reward: A positive opportunity.
Decisive Moment: A playable high-tension situation during a match.


Chapter 02 — World & Campaign
Purpose
Define the structure of a World Cup campaign outside the match itself. This chapter
explains how the tournament progresses, how time flows, and how the player
experiences the World Cup between matches.
Campaign Structure
Each run represents one complete FIFA World Cup campaign.
Flow:
National Team Selection → Group Draw → Group Stage → Knockout Stage →
Tournament End.
The Group Stage is primarily used to build the team's philosophy, while the Knockout
Stage tests the player's ability to adapt.
The World Cup as a Living System
The tournament continues regardless of the player's actions.
Other teams play matches, suffer injuries, surprise favorites, and create headlines.
The player should constantly feel part of a larger competition rather than an isolated
sequence of encounters.
The Training Camp (Hub)
The Training Camp is the central hub between matches.
From here the player can:
• Advance the calendar.
• Manage the squad.
• Equip items and adjust formations.
• Review standings and knockout brackets.
• Read the campaign journal.
The hub should feel like living inside a World Cup camp rather than navigating menus.
Calendar
Time advances one day at a time.
Each day contains exactly one meaningful player decision.
After the decision, the world reacts through systemic consequences, news and
tournament progression.
The day—not hours—is the fundamental planning unit to preserve accessibility and
pacing.
Daily Flow
Start Day →
Player Decision →
World Reaction →
News & Minor Consequences →
Daily Report →
Next Day.


Daily Decisions
Examples include:
• Training focus.
• Media management.
• Recovery.
• Tactical preparation.
• Squad management.
Not every decision produces dramatic outcomes; quiet days are important for pacing.
World Reactions
A decision may trigger:
• Immediate consequences.
• Delayed consequences.
• Butterfly effects.
Randomness is controlled and context-sensitive rather than arbitrary.
Campaign Journal
The calendar doubles as the memory of the run.
Players should be able to scroll back through previous days and naturally reconstruct
the story of their campaign.
Tournament Information
The player always has access to:
• Group standings.
• Fixtures.
• Knockout bracket.
• Results from other teams.
These elements reinforce the feeling that the World Cup is alive.
Design Principles
• Every new day should create anticipation.
• The calendar is navigation, memory and pacing.
• Preparation should feel like planning against the next opponent rather than
optimizing statistics.
• The world should surprise the player without feeling unfair.


Chapter 03 — Core Gameplay
Purpose
Define what the player actually does from the beginning to the end of a run. This
chapter focuses on the gameplay loop rather than implementation details.
Core Gameplay Loop
Preparation →
Match →
Consequences →
Preparation
Every completed loop should strengthen, challenge or redefine the team's philosophy.
Preparation Loop
At the start of each day the player:
• Reviews the current situation.
• Makes one meaningful decision.
• Watches the world react.
• Receives a daily report.
Preparation should create anticipation for the upcoming match.
Match Loop
Matches alternate between three interaction states:
1. Calm Decisions
2. High-Pressure Decisions
3. Skill Moments
The match continuously shifts between these states to maintain pacing and emotional
variety.
Calm Decisions
The player has time to think.
Examples:
• Tactical adjustments.
• Formation changes.
• Substitutions.
• Resource management.
High-Pressure Decisions
Unexpected situations require immediate choices under time pressure.
There is rarely a perfect answer.
These moments create tension and responsibility.
Skill Moments
Playable decisive moments represent the emotional climax of the match.
Their difficulty depends on:


• Player ratings.
• Current philosophy.
• Context.
• Previous decisions.
Skill complements preparation rather than replacing it.
Match Principles
• The player controls decisive moments, not ninety continuous minutes.
• Preparation should noticeably influence the match.
• Every decisive moment should feel earned through previous choices.
Flow Between Systems
Preparation creates a plan.
The match tests the plan.
Consequences modify the next preparation phase.
This creates a continuous feedback loop throughout the campaign.
Player Agency
Players should always understand:
• What they are trying to achieve.
• Why a situation happened.
• Which decisions influenced the outcome.
Randomness should create stories, not excuses.
Design Principles
• Decisions are the primary interaction.
• Skill creates memorable moments.
• Context gives meaning to every action.
• No match should feel worth simulating automatically.


Chapter 04 — Systems Bible
Purpose
Describe the high-level systems that support the gameplay. This chapter defines
responsibilities and relationships between systems without specifying formulas or
implementation.
Core Systems
The project is built around interconnected systems rather than isolated mechanics.
Every major feature should influence multiple other systems.
Player System
National teams, players, ratings, positions, status, morale and availability.
Philosophy System
The evolving tactical identity of the team. It is the primary source of long-term
progression during a run.
Progression System
Player upgrades, philosophy growth, rewards and persistent unlocks (if applicable).
Conflict System
Branching situations requiring meaningful trade-offs. Conflicts may escalate, resolve
naturally or evolve into stories.
Event System
Context-sensitive world events that change the campaign independently of the player's
wishes.
Reward System
Rewards are grouped into families that compete for player attention, encouraging
specialization instead of universal optimization.
Match System
Preparation feeds the match. The match generates consequences that feed future
preparation.
System Principles
Systems should interact, generate stories and remain readable. Complexity should
emerge from interaction, not from isolated rules.


Chapter 05 — Content Bible
Purpose
Define the philosophy behind game content rather than listing assets. Content exists to
enrich systems, not replace them.
Content Philosophy
Reusable systemic content is prioritized over handcrafted one-off content.
Events
Positive, negative and neutral world occurrences that enrich campaign variety.
Conflicts
Narrative dilemmas with meaningful trade-offs and possible escalation.
Rewards
Objects, philosophy upgrades, staff improvements, player growth and tactical
opportunities.
Stories
Emergent narratives created by chains of events and decisions. Hidden stories are
encouraged to promote discovery.
Achievements
Achievements celebrate memorable stories rather than repetitive grinding.
National Teams
Each team is defined by identity, strengths, weaknesses and philosophy affinities
rather than only overall rating.
Future Content
Selection-specific stories, legendary moments and additional narrative packs are
reserved for post-launch updates.
Content Principles
Content should increase replayability, reinforce player fantasy and always support the
game's systemic design.


Chapter 06 — UX Principles
Purpose
Define how information, decisions and feedback should be communicated to the
player. UX exists to reinforce clarity, pacing and immersion rather than visual
complexity.
Core UX Philosophy
Every interface should answer one question: 'What is the next meaningful decision?'
Information should support decisions, not overwhelm the player.
Information Clarity
Player ratings are visible. Risks, probabilities and uncertainty are communicated
qualitatively (Low / Medium / High) instead of exact percentages.
Decision Hierarchy
Common decisions use lightweight interfaces. Important decisions receive additional
narrative context. Memorable decisions deserve unique presentation and pacing.
Pacing
The interface should never interrupt the flow unnecessarily. Navigation must remain
fast enough to complete a full World Cup in a single session.
Feedback
Every decision should produce visible consequences, either immediately or later in the
campaign. Players should understand why important outcomes occurred.
Immersion
Menus represent locations and activities inside the World Cup whenever possible
(Training Camp, Medical Staff, Press Room, Calendar) instead of abstract game menus.
Accessibility
The game should remain understandable for both football fans and players with limited
football knowledge.
UX Principles
Clarity over realism. Meaningful choices over information density. Fast interaction over
excessive menu depth.


Chapter 07 — Live Roadmap
Purpose
Define the development scope and long-term direction of the project.
MVP Goals
Deliver a complete, replayable World Cup roguelike where the preparation loop, match
loop and emergent storytelling already express the core fantasy.
Included in MVP
• World Cup campaign
• Philosophy system
• Preparation calendar
• Events, conflicts and rewards
• Simplified squads
• Decisive match moments
• Emergent stories
Post-Launch Content
• Selection-specific stories
• Additional philosophies
• New events and conflicts
• More skill moments
• Legendary scenarios
• Cosmetic progression
Out of Scope
• Full football simulation
• Managing 26-player squads
• Complex finances
• Transfers
• Club management
• Excessive micromanagement
Development Principles
Every new feature must strengthen the player fantasy. Systems are prioritized before
handcrafted content. New mechanics should simplify or enrich existing gameplay
rather than expand scope unnecessarily.
Vision Lock
The Game Vision is considered stable. Future iterations should refine execution instead
of redefining the identity of the project.
