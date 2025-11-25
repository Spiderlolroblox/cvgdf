import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TutorialStep {
  title: string;
  description: string;
  targetId: string;
  arrowPosition: "top" | "bottom" | "left" | "right";
  position: "top" | "bottom" | "left" | "right";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Bienvenue dans le Chat",
    description:
      "Ceci est votre interface de chat intelligente. Commencez par explorer les différentes fonctionnalités!",
    targetId: "chat-area",
    arrowPosition: "top",
    position: "bottom",
  },
  {
    title: "Créer une Nouvelle Conversation",
    description:
      "Cliquez ici pour démarrer une nouvelle conversation. Chacune est enregistrée séparément.",
    targetId: "new-conversation-btn",
    arrowPosition: "right",
    position: "right",
  },
  {
    title: "Gérer Vos Conversations",
    description:
      "Vos conversations apparaissent ici. Survolez pour modifier ou supprimer.",
    targetId: "conversations-list",
    arrowPosition: "right",
    position: "right",
  },
  {
    title: "Envoyer des Messages",
    description:
      "Tapez votre message ici. Appuyez sur Entrée pour envoyer ou Maj+Entrée pour une nouvelle ligne.",
    targetId: "message-input",
    arrowPosition: "top",
    position: "top",
  },
  {
    title: "Ajouter des Emojis",
    description:
      "Cliquez sur ce sourire pour ajouter des emojis à vos messages et les rendre plus expressifs!",
    targetId: "emoji-btn",
    arrowPosition: "top",
    position: "top",
  },
  {
    title: "Vérifiez Votre Utilisation",
    description:
      "Le compteur montre combien de messages il vous reste. Améliorez votre plan pour plus de messages.",
    targetId: "messages-counter",
    arrowPosition: "top",
    position: "top",
  },
];

function Arrow({
  position,
  direction,
}: {
  position: { x: number; y: number };
  direction: "top" | "bottom" | "left" | "right";
}) {
  const arrowVariants: Record<string, string> = {
    top: "rotate-180",
    bottom: "rotate-0",
    left: "rotate-90",
    right: "-rotate-90",
  };

  return (
    <svg
      className={`absolute w-8 h-8 text-white ${arrowVariants[direction]}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M7 14l5 5 5-5z" />
      <defs>
        <filter id="arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

export function HelpModal({ isOpen, onOpenChange }: HelpModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [arrowPos, setArrowPos] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const step = TUTORIAL_STEPS[currentStep];

  useEffect(() => {
    if (!isOpen) return;

    const updatePositions = () => {
      const target = document.getElementById(step.targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const tooltipWidth = 300;
        const tooltipHeight = 200;
        const padding = 16;

        let arrowX = centerX;
        let arrowY = centerY;
        let tooltipX = centerX - tooltipWidth / 2;
        let tooltipY = centerY - tooltipHeight / 2;

        switch (step.arrowPosition) {
          case "top":
            arrowY = rect.top - 20;
            tooltipY = rect.top - tooltipHeight - 40;
            break;
          case "bottom":
            arrowY = rect.bottom + 20;
            tooltipY = rect.bottom + 60;
            break;
          case "left":
            arrowX = rect.left - 40;
            tooltipX = rect.left - tooltipWidth - 40;
            tooltipY = centerY - tooltipHeight / 2;
            break;
          case "right":
            arrowX = rect.right + 40;
            tooltipX = rect.right + 40;
            tooltipY = centerY - tooltipHeight / 2;
            break;
        }

        // Clamp tooltip to viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        tooltipX = Math.max(
          padding,
          Math.min(tooltipX, viewportWidth - tooltipWidth - padding),
        );
        tooltipY = Math.max(
          padding,
          Math.min(tooltipY, viewportHeight - tooltipHeight - padding),
        );

        setArrowPos({ x: arrowX - 16, y: arrowY - 16 });
        setTooltipPos({ x: tooltipX, y: tooltipY });
      }
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [isOpen, step.targetId, currentStep]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Target Highlight */}
      {targetRect && (
        <div
          className="fixed z-40 border-2 border-white/80 rounded-lg shadow-lg shadow-white/20 pointer-events-none transition-all"
          style={{
            left: `${targetRect.left - 8}px`,
            top: `${targetRect.top - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            boxShadow:
              "0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1)",
          }}
        />
      )}

      {/* Arrow Pointer */}
      <Arrow position={arrowPos} direction={step.arrowPosition} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-card border-2 border-white/80 rounded-2xl p-5 max-w-xs shadow-2xl"
        style={{
          left: `${tooltipPos.x}px`,
          top: `${tooltipPos.y}px`,
          transform: "translate(0, 0)",
        }}
      >
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-white mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress */}
          <div className="pt-2">
            <div className="flex gap-1 mb-2">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    idx === currentStep
                      ? "bg-white"
                      : idx < currentStep
                        ? "bg-white/60"
                        : "bg-white/20"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-foreground/60">
              Étape {currentStep + 1} sur {TUTORIAL_STEPS.length}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-white/40 rounded-lg text-foreground/80 hover:text-white hover:border-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
              Précédent
            </button>

            <button
              onClick={() => onOpenChange(false)}
              className="ml-auto p-1.5 text-foreground/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={16} />
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === TUTORIAL_STEPS.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-white/80 rounded-lg text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Suivant
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
