const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AnswerPad({
  input,
  answerLength,
  disabled = false,
  onLetter,
  onBackspace,
  onClear,
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
        <div className="grid grid-cols-7 gap-2 flex-1 content-center">
          {LETTERS.map((char) => (
            <button
              key={char}
              onClick={stop(() => input.length < answerLength && onLetter(char))}
              disabled={disabled || input.length >= answerLength}
              className="min-h-[56px] rounded-xl bg-yellow-300 text-slate-900 text-xl font-bold active:scale-95 disabled:opacity-40"
            >
              {char}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-rows-3 gap-3">
        <button
          onClick={stop(onBackspace)}
          disabled={disabled || input.length === 0}
          className="rounded-xl bg-slate-500 text-white text-lg font-bold min-h-[64px] disabled:opacity-40"
        >
          ⬅ 退格
        </button>
        <button
          onClick={stop(onClear)}
          disabled={disabled || input.length === 0}
          className="rounded-xl bg-slate-500 text-white text-lg font-bold min-h-[64px] disabled:opacity-40"
        >
          🔄 清除
        </button>
        <button
          onClick={stop(onSubmit)}
          disabled={submitDisabled}
          className="rounded-xl bg-green-600 text-white text-xl font-extrabold min-h-[72px] disabled:opacity-40"
        >
          ✅ 確認
        </button>
      </div>
    </div>
  );
}
