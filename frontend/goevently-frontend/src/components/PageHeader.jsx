export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <h1 className="text-5xl font800 tracking-[-0.04em] text-[#0b1533]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-3xl text-lg font500 leading-8 text-[#66708a]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}