"use client";

import React, { useState } from "react";
import { AppUIState, UIEventType } from "@/lib/uiStateMachine/types";
import { transition } from "@/lib/uiStateMachine/machine";

import { VaktHeader } from "./components/VaktHeader";
import { OnboardingState } from "./components/OnboardingState";
import { SessionPreviewState } from "./components/SessionPreviewState";
import { DeliveryState } from "./components/DeliveryState";
import { ComprehensionGateState } from "./components/ComprehensionGateState";
import { AnalyticBreakdownState } from "./components/AnalyticBreakdownState";
import { KinestheticWordcardState } from "./components/KinestheticWordcardState";
import { KinestheticClassificationState } from "./components/KinestheticClassificationState";
import { OralPrepState } from "./components/OralPrepState";
import { OralActiveState } from "./components/OralActiveState";
import { SttInputState } from "./components/SttInputState";
import { FeedbackState } from "./components/FeedbackState";
import { RecoveryBreakState } from "./components/RecoveryBreakState";
import { SessionDebriefState } from "./components/SessionDebriefState";
import { SettingsState } from "./components/SettingsState";
import { ProfileReviewState } from "./components/ProfileReviewState";

import { Scenario } from "@/lib/scenario/types";
import { FeedbackPackage } from "@/lib/feedback/types";

export default function Home() {
  const [currentState, setCurrentState] = useState<AppUIState>("ONBOARDING");
  const [cognitiveLoadIndex, setCognitiveLoadIndex] = useState<number>(0.35);
  const [monthPhase, setMonthPhase] = useState<number>(1);
  const [oralComfort, setOralComfort] = useState<number>(0.4);

  const [scaffolding, setScaffolding] = useState({
    show_l1_translation: true,
    show_grammar_labels: true,
    word_cards_presorted: false,
    oral_prep_time_seconds: 20,
    codeswitching_invite_shown: true,
  });

  // Sample active scenario & turn
  const [scenario] = useState<Scenario>({
    scenario_id: "demo-scenario-01",
    generated_at: new Date().toISOString(),
    domain_tag: "computational_physics",
    context_tag: "academic_collaboration",
    difficulty_level: "A1",
    target_grammar_concepts: ["concept-akkusativ", "concept-perfekt"],
    target_vocabulary: ["optimieren", "Modell", "Ergebnis"],
    scenario_premise: "Du besprichst die Simulation einer Phasenraum-Animation in Python mit deinem Kollegen.",
    scenario_premise_l1: "You are discussing a phase space animation simulation in Python with your German colleague.",
    dialogue_turns: [
      {
        speaker: "AI_AGENT",
        text_de: "Ich habe die Simulation für das Modell gestartet.",
        text_l1: "I started the simulation for the model.",
        word_card_set: [
          { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 0 },
          { word_de: "habe", grammatical_role: "VERB", correct_position: 1 },
          { word_de: "die", grammatical_role: "ART", correct_position: 2 },
          { word_de: "Simulation", grammatical_role: "AKK-OBJ", correct_position: 3 },
          { word_de: "gestartet", grammatical_role: "VERB-PART", correct_position: 4 },
        ],
      },
      {
        speaker: "USER",
        text_de: "Ich habe das Ergebnis bereits geprüft.",
        text_l1: "I have already checked the result.",
        word_card_set: [
          { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 0 },
          { word_de: "habe", grammatical_role: "VERB", correct_position: 1 },
          { word_de: "das", grammatical_role: "ART", correct_position: 2 },
          { word_de: "Ergebnis", grammatical_role: "AKK-OBJ", correct_position: 3 },
          { word_de: "geprüft", grammatical_role: "VERB-PART", correct_position: 4 },
        ],
      },
    ],
    review_concepts_embedded: [],
  });

  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const activeTurn = scenario.dialogue_turns[currentTurnIndex] || scenario.dialogue_turns[0];

  const [feedback, setFeedback] = useState<FeedbackPackage>({
    primary_message: "Your meaning came through clearly.",
    grammar_correction: "Ah, du hast das Ergebnis geprüft — hervorragend!",
    rule_reminder: "In German Perfekt tense, the past participle (geprüft) goes to the end of the sentence.",
    pronunciation_note: "Watch the /g/ sound in 'geprüft'.",
    codeswitching_note: ["result ➔ Ergebnis"],
  });

  const dispatchEvent = (eventType: UIEventType, payload?: Record<string, unknown>) => {
    const result = transition(currentState, eventType);
    if (result.valid) {
      setCurrentState(result.to);
    } else {
      console.warn(`Invalid transition: ${result.error}`);
    }
  };

  // Trigger Cognitive Load Escalation simulate
  const handleSimulateLoadEscalation = () => {
    setCognitiveLoadIndex(0.85);
    dispatchEvent("LOAD_ESCALATION");
  };

  return (
    <main style={{ minHeight: "100vh", padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* VAKT Telemetry Header */}
      <VaktHeader
        currentState={currentState}
        cognitiveLoadIndex={cognitiveLoadIndex}
        monthPhase={monthPhase}
        oralComfort={oralComfort}
        scaffolding={scaffolding}
        onStateSelect={(st) => setCurrentState(st)}
      />

      {/* Developer State Switcher Bar */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        padding: "0.75rem 1rem",
        borderRadius: "12px",
        marginBottom: "1.5rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>
          State Machine Navigator (15 States):
        </span>
        {[
          "ONBOARDING",
          "SESSION_PREVIEW",
          "DELIVERY_AUDITORY_VISUAL",
          "COMPREHENSION_GATE",
          "ANALYTIC_BREAKDOWN",
          "KINESTHETIC_WORDCARD",
          "KINESTHETIC_CLASSIFICATION",
          "ORAL_PREPARATION",
          "ORAL_ACTIVE",
          "STT_INPUT",
          "FEEDBACK_DISPLAY",
          "RECOVERY_BREAK",
          "SESSION_DEBRIEF",
          "SETTINGS",
          "PROFILE_REVIEW",
        ].map((st) => (
          <button
            key={st}
            onClick={() => setCurrentState(st as AppUIState)}
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "6px",
              border: currentState === st ? "1px solid var(--accent-primary)" : "1px solid rgba(255,255,255,0.1)",
              background: currentState === st ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.04)",
              color: currentState === st ? "#ffffff" : "var(--text-muted)",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontWeight: currentState === st ? "700" : "400",
            }}
          >
            {st}
          </button>
        ))}

        <button
          onClick={handleSimulateLoadEscalation}
          style={{
            marginLeft: "auto",
            padding: "0.25rem 0.6rem",
            borderRadius: "6px",
            background: "rgba(244, 63, 94, 0.2)",
            border: "1px solid var(--accent-rose)",
            color: "#fecdd3",
            fontSize: "0.75rem",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          ⚡ Simulate Critical Load (&gt;0.8)
        </button>
      </div>

      {/* Render Active UI State View Component */}
      {currentState === "ONBOARDING" && (
        <OnboardingState
          onComplete={(data) => {
            console.log("Onboarding data:", data);
            dispatchEvent("ONBOARDING_COMPLETE");
          }}
        />
      )}

      {currentState === "SESSION_PREVIEW" && (
        <SessionPreviewState
          scenario={scenario}
          onConfirmReady={() => dispatchEvent("USER_CONFIRMS_READY")}
        />
      )}

      {currentState === "DELIVERY_AUDITORY_VISUAL" && (
        <DeliveryState
          turn={activeTurn}
          scaffolding={scaffolding}
          onAudioComplete={() => dispatchEvent("AUDIO_COMPLETE")}
        />
      )}

      {currentState === "COMPREHENSION_GATE" && (
        <ComprehensionGateState
          sentenceDe={activeTurn.text_de}
          sentenceL1={activeTurn.text_l1}
          onYes={() => dispatchEvent("USER_SELECTS_YES")}
          onReplay={() => dispatchEvent("USER_SELECTS_REPLAY")}
          onExplain={() => dispatchEvent("USER_SELECTS_EXPLAIN")}
        />
      )}

      {currentState === "ANALYTIC_BREAKDOWN" && (
        <AnalyticBreakdownState
          turn={activeTurn}
          onComplete={() => dispatchEvent("BREAKDOWN_COMPLETE")}
        />
      )}

      {currentState === "KINESTHETIC_WORDCARD" && (
        <KinestheticWordcardState
          turn={scenario.dialogue_turns[1] || activeTurn}
          presorted={scaffolding.word_cards_presorted}
          onTaskComplete={() => dispatchEvent("TASK_COMPLETE")}
          onTaskSkipped={() => dispatchEvent("TASK_SKIPPED")}
        />
      )}

      {currentState === "KINESTHETIC_CLASSIFICATION" && (
        <KinestheticClassificationState
          onComplete={() => dispatchEvent("TASK_COMPLETE")}
        />
      )}

      {currentState === "ORAL_PREPARATION" && (
        <OralPrepState
          turn={scenario.dialogue_turns[1] || activeTurn}
          prepTimeSeconds={scaffolding.oral_prep_time_seconds}
          showCodeswitchInvite={scaffolding.codeswitching_invite_shown}
          onCountdownComplete={() => dispatchEvent("COUNTDOWN_COMPLETE")}
          onReadyEarly={() => dispatchEvent("USER_SELECTS_READY_EARLY")}
          onTypeInstead={() => dispatchEvent("USER_SELECTS_TYPE_INSTEAD")}
        />
      )}

      {currentState === "ORAL_ACTIVE" && (
        <OralActiveState
          targetText={scenario.dialogue_turns[1]?.text_de || activeTurn.text_de}
          onSpeechComplete={(transcript, latency) => {
            console.log("Speech complete:", transcript, latency);
            dispatchEvent("SPEECH_DETECTED_AND_ENDED");
          }}
          onTimeout={() => dispatchEvent("TIMEOUT_NO_SPEECH")}
          onAbandon={() => dispatchEvent("USER_ABANDONS")}
        />
      )}

      {currentState === "STT_INPUT" && (
        <SttInputState
          targetText={scenario.dialogue_turns[1]?.text_de || activeTurn.text_de}
          onSubmit={(text, l1s) => {
            console.log("STT submit:", text, l1s);
            dispatchEvent("SUBMISSION_COMPLETE");
          }}
        />
      )}

      {currentState === "FEEDBACK_DISPLAY" && (
        <FeedbackState
          feedback={feedback}
          onDismiss={() => dispatchEvent("USER_DISMISSES")}
        />
      )}

      {currentState === "RECOVERY_BREAK" && (
        <RecoveryBreakState
          onBreakComplete={() => {
            setCognitiveLoadIndex(0.4);
            dispatchEvent("BREAK_COMPLETE");
          }}
          onEndSession={() => dispatchEvent("USER_ENDS_SESSION")}
        />
      )}

      {currentState === "SESSION_DEBRIEF" && (
        <SessionDebriefState
          onExit={() => dispatchEvent("USER_EXITS")}
        />
      )}

      {currentState === "SETTINGS" && (
        <SettingsState
          onBack={() => setCurrentState("SESSION_PREVIEW")}
        />
      )}

      {currentState === "PROFILE_REVIEW" && (
        <ProfileReviewState
          onBack={() => setCurrentState("SESSION_PREVIEW")}
        />
      )}

    </main>
  );
}
