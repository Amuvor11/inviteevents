import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarHeart,
  Users,
  BarChart3,
  Palette,
  ClipboardList,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { TEMPLATE_LABELS } from "@/lib/i18n/uk";

const features = [
  { icon: Palette, title: "Красиві шаблони", desc: "Класичний, мінімалістичний, елегантний, романтичний, сучасний та дитячий стилі." },
  { icon: Users, title: "Групи гостей", desc: "Відстежуйте сім'ї, пари та групи — рахуйте кожного дорослого і дитину." },
  { icon: ClipboardList, title: "Власні опитування", desc: "Запитуйте про меню, алергії, тости, пісні та інше — 7 типів питань." },
  { icon: BarChart3, title: "Аналітика в реальному часі", desc: "Статистика RSVP, відвідуваність і результати опитувань з графіками." },
  { icon: CalendarHeart, title: "Зворотний відлік і розклад", desc: "Захоплюючі сторінки запрошень з таймером і розкладом події." },
  { icon: Sparkles, title: "Миттєве поширення", desc: "SEO-посилання на кшталт /invite/anna-ta-ivan-vesillya." },
];

const templates = ["Classic", "Minimal", "Elegant", "Romantic", "Modern", "Kids Party"];

const faqs = [
  { q: "Чи можна керувати сім'ями та групами?", a: "Так! Одна відповідь RSVP може представляти кількох гостей — ідеально для весіль і сімейних подій." },
  { q: "Які типи питань підтримуються?", a: "Короткий текст, довгий текст, один варіант, кілька варіантів, так/ні, число та випадаючий список." },
  { q: "Чи можуть гості відповісти без реєстрації?", a: "Звісно. Гості відповідають через персональне посилання — реєстрація не потрібна." },
  { q: "Чи є безкоштовний план?", a: "Ціни з'являться незабаром. Поки що створюйте запрошення безкоштовно під час запуску сервісу." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Весілля · Дні народження · Святкування
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Створюйте красиві онлайн-запрошення
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Дизайн цифрових запрошень, керування гостями, збір RSVP з опитуваннями та відстеження відвідуваності — все в одному місці.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg">Почати безкоштовно</Button>
            </Link>
            <a href="#templates">
              <Button size="lg" variant="outline">Переглянути шаблони</Button>
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">Усе для вашої події</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Для весіль, днів народження, хрестин, випускних, корпоративів та інших свят.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold">Шаблони запрошень</h2>
          <p className="mt-3 text-muted-foreground">Шість стильних макетів — одні дані, різний вигляд.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((name) => (
              <div
                key={name}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <p className="text-2xl font-serif font-semibold">{TEMPLATE_LABELS[name] ?? name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Попередній перегляд</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold">Як це працює</h2>
          <ol className="mt-12 space-y-8">
            {[
              "Увійдіть через Google",
              "Створіть подію та оберіть шаблон",
              "Додайте групи гостей, питання та галерею",
              "Опублікуйте та поділіться посиланням",
              "Відстежуйте RSVP, гостей та аналітику",
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-1 text-lg">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold">Простий тариф</h2>
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Запуск — безкоштовно</CardTitle>
              <CardDescription>Повний доступ під час запуску сервісу</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-left">
              {["Необмежена кількість подій", "Групи гостей та опитування", "Аналітика та експорт CSV", "Завантаження зображень"].map((f) => (
                <p key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {f}
                </p>
              ))}
              <Link href="/login" className="block pt-4">
                <Button className="w-full">Почати</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="faq" className="border-t border-border bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold">Часті запитання</h2>
          <div className="mt-10 space-y-4">
            {faqs.map(({ q, a }) => (
              <Card key={q}>
                <CardHeader>
                  <CardTitle className="text-base">{q}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-foreground/80">{a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Готові створити запрошення?</h2>
          <p className="mt-3 opacity-90">Приєднуйтесь до організаторів, які створюють незабутні події.</p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg" variant="secondary">Створити перше запрошення</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} InviteEvents. Усі права захищені.
      </footer>
    </div>
  );
}
