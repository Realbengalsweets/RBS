export default function Home() {
  const highlights = [
    {
      emoji: "🍰",
      title: "Freshly Made",
      description: "Every batch is made from scratch each morning, never stocked or frozen.",
    },
    {
      emoji: "🌾",
      title: "Honest Ingredients",
      description: "Real butter, real sugar, real cocoa — nothing artificial, ever.",
    },
    {
      emoji: "🎂",
      title: "Custom Orders",
      description: "Birthdays, weddings, or just because — we'll make it exactly how you like it.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center bg-background font-sans text-foreground">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center gap-16 px-6 py-24 text-center sm:py-32">
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl">🍬</span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Sweet Haven
          </h1>
          <p className="max-w-md text-lg leading-8 text-foreground/70">
            A small-batch sweet shop serving handmade candy, cakes, and
            confections since day one.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{item.emoji}</span>
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="text-sm leading-6 text-foreground/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <a
          href="mailto:hello@sweethaven.example"
          className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/80"
        >
          Get in Touch
        </a>
      </main>
    </div>
  );
}
