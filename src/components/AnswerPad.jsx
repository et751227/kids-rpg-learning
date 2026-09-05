import { ANSWER_KEY_ROWS } from "../game/answerPadLayout";

export default function AnswerPad({
  input,
  answerLength,
  disabled = false,
  onLetter,
  onBackspace,
  onSubmit,
}) {
  const submitDisabled = disabled || input.length === 0 || input.length !== answerLength;

  const stop = (handler) => (event) => {
    event.stopPropagation();
    handler();
  };

  return (
    <div className="grid md:grid-cols-[1fr_180px] gap-4 w-full max-w-5xl min-h-0">
      <div className="rounded-2xl bg-white/90 p-4 flex flex-col gap-3 min-h-0 shadow-xl">
        <div className="text-center text-3xl md:text-4xl tracking-widest font-mono text-slate-900 rounded-full py-2 px-4 min-h-[64px] flex items-center justify-center border-2 border-slate-200">
          {input.join("") || "⋯"}
        </div>
        <div className="flex flex-col gap-2 flex-1 justify-center">
          {ANSWER_KEY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map((char) => (
                <button
                  key={char}
                  type="button"
                  data-letter={char}
                  aria-label={`Letter ${char}`}
                  onClick={stop(() => input.length < answerLength && onLetter(char))}
                  disabled={disabled || input.length >= answerLength}
                  className="min-h-[56px] flex-1 max-w-[78px] rounded-xl bg-yellow-300 text-slate-900 text-xl font-bold active:scale-95 disabled:opacity-40 touch-manipulation select-none"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-rows-2 gap-3">
        <button
          type="button"
          onClick={stop(onBackspace)}
          disabled={disabled || input.length === 0}
          className="rounded-xl bg-slate-500 text-white text-lg font-bold min-h-[72px] disabled:opacity-40 touch-manipulation"
        >
          ⬅ 退格
        </button>
        <button
          type="button"
          onClick={stop(onSubmit)}
          disabled={submitDisabled}
          className="rounded-xl bg-green-600 text-white text-xl font-extrabold min-h-[84px] disabled:opacity-40 touch-manipulation"
        >
          ✅ 確認
        </button>
      </div>
    </div>
  );
}
