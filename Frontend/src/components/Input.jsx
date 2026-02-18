function Input({ label, type, name, placeholder, defaultValue, register, error, options = [], disabled }) {
  return (
    <div className="my-2">
      <h1 className="font-semibold">{label}</h1>
      {type === "select" ? (
        <select
          {...register(name)}
          defaultValue={defaultValue}
          className="w-full inline-block bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1"
          disabled={disabled}
        >
          <option value="">Selecciona...</option>
          {options.map((option, index) => {
            // Si la opción es string, value = string.toLowerCase()
            if (typeof option === "string") {
              return (
                <option key={index} value={option.toLowerCase()}>
                  {option}
                </option>
              );
            }
            // Si la opción es objeto { label, value }, usamos value y mostramos label
            return (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          {...register(name)}
          type={type || "text"}
          placeholder={placeholder || label}
          className={`w-full bg-zinc-100 px-4 py-3 rounded-lg outline-none text-sm my-1 ${disabled ? "cursor-not-allowed select-none text-zinc-400" : ""}`}
          disabled={disabled}
          defaultValue={defaultValue}
        />
      )}
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}

export default Input;
