const STEPS = [
  {
    number: "01",
    title: "Choose your piece",
    copy: "Select from the Corporate and Premium Casual collections — every cut, every colour, in one place.",
  },
  {
    number: "02",
    title: "Set your fit",
    copy: "Take a standard off-the-rack size, or send six measurements and we tailor the piece to you.",
  },
  {
    number: "03",
    title: "Wear it with confidence",
    copy: "We finish, press, and deliver to your door. Every order is confirmed in writing.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-white">
      <div className="shell py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="label-caps">How It Works</p>
          <h2 className="section-title mt-3">Three steps to a proper fit</h2>
          <p className="mt-5 text-base leading-relaxed text-brand-light">
            No fitting rooms, no guesswork. Order in minutes and let the measurements do the work.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="bg-white p-8 sm:p-10">
              <p className="font-display text-3xl text-brand-soft">{step.number}</p>
              <h3 className="mt-6 font-display text-lg text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-light">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
