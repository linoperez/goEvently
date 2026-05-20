export default function ErrorState({ title = "Something went wrong", message }) {
  return (
    <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
      <h3 className="text-lg font800 text-red-700">{title}</h3>
      {message ? (
        <p className="mt-2 text-sm font600 text-red-600">{message}</p>
      ) : null}
    </div>
  );
}