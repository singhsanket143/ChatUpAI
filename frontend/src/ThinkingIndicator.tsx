type Props = {
  label?: string;
};

export function ThinkingIndicator({ label = "Thinking" }: Props) {
  return (
    <div className="thinking" role="status" aria-live="polite">
      <span className="thinking-wave" aria-hidden="true">
        <span className="thinking-wave-bar" />
        <span className="thinking-wave-bar" />
        <span className="thinking-wave-bar" />
      </span>
      <span className="thinking-label">{label}</span>
    </div>
  );
}