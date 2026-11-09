import { FormEvent, useEffect, useRef, useState } from "react"
import logoImage from "./logo.png"

type FormStatus = "idle" | "sending" | "sent" | "error"

// Contact API (server/contact-server.mjs). In development Vite proxies /api to it.
// In production, set VITE_CONTACT_API_URL to the deployed API, e.g. https://api.example.com/api/contact.
const CONTACT_API_URL = import.meta.env.VITE_CONTACT_API_URL || "/api/contact"
const DEFAULT_SEND_ERROR =
  "L'envoi de votre demande a échoué. Veuillez réessayer plus tard ou nous écrire directement par email."

type IconName = "arrow" | "audit" | "blockchain" | "briefcase" | "building" | "check" | "chevron" | "close" | "finance" | "incubator" | "linkedin" | "mail" | "menu" | "phone" | "plan" | "quote" | "shield" | "spark" | "strategy" | "user"

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }
  const paths: Record<IconName, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    audit: (
      <>
        <path d="M4 4h16v16H4z" />
        <path d="M8 15v-3m4 3V8m4 7v-5" />
      </>
    ),
    blockchain: (
      <>
        <path d="m12 2 4 2.3v4.6L12 11 8 8.9V4.3zM6 13l4 2.3v4.6L6 22l-4-2.1v-4.6zm12 0 4 2.3v4.6L18 22l-4-2.1v-4.6z" />
        <path d="m12 11v4.3" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V4h8v3m-13 5h18M10 12v2h4v-2" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V3h12v18M16 9h4v12M8 7h4m-4 4h4m-4 4h4M2 21h20" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    finance: (
      <>
        <path d="M3 21h18M5 18V9m5 9V5m5 13v-7m5 7V3" />
        <path d="m4 5 5-3 5 3 6-3" />
      </>
    ),
    incubator: (
      <>
        <path d="M9 15c-3 1-4 3-4 6 3 0 5-1 6-4M15 15c3 1 4 3 4 6-3 0-5-1-6-4" />
        <path d="M12 17c-4-4-4-10 0-15 4 5 4 11 0 15Z" />
        <circle cx="12" cy="9" r="2" />
      </>
    ),
    linkedin: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2a5 5 0 0 1 2-3Z" />
        <path d="M2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    ),
    plan: (
      <>
        <path d="M4 3h16v18H4z" />
        <path d="M8 8h8M8 12h5M8 16h3" />
      </>
    ),
    quote: (
      <path d="M7 17H3v-4a7 7 0 0 1 7-7v3a4 4 0 0 0-3 4Zm10 0h-4v-4a7 7 0 0 1 7-7v3a4 4 0 0 0-3 4Z" />
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.3 4.7L18 9l-4.7 1.3L12 15l-1.3-4.7L6 9l4.7-1.3Z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
      </>
    ),
    strategy: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
        <path d="m15.5 8.5 4-4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  }
  return <svg {...common}>{paths[name]}</svg>
}

const services: { icon: IconName title: string description: string }[] = [
  {
    icon: "audit",
    title: "Financial Audit",
    description:
      "Audit financier, contrôle interne, analyse financière et évaluation rigoureuse des risques.",
  },
  {
    icon: "finance",
    title: "Financial & Tax Advisory",
    description:
      "Conseil financier, planification fiscale, optimisation et assistance en matière de fiscalité.",
  },
  {
    icon: "building",
    title: "Chartered Accountancy",
    description:
      "Tenue comptable, états financiers, assistance comptable et accompagnement au quotidien.",
  },
  {
    icon: "blockchain",
    title: "Blockchain Advisory",
    description:
      "Conseil blockchain, stratégies Web3 et accompagnement structuré des projets innovants.",
  },
  {
    icon: "plan",
    title: "Fundraising",
    description:
      "Étude de marché, projections financières, stratégie et élaboration de business plans solides.",
  },
  {
    icon: "incubator",
    title: "Startup",
    description:
      "Soutien aux startups, mentorat entrepreneurial, business development et pilotage stratégique.",
  },
]

const values = [
  {
    icon: "shield" as IconName,
    title: "Intégrité",
    text: "Une exigence de transparence et de rigueur dans chaque mission.",
  },
  {
    icon: "strategy" as IconName,
    title: "Excellence",
    text: "Des standards élevés au service de décisions plus éclairées.",
  },
  {
    icon: "spark" as IconName,
    title: "Innovation",
    text: "Une lecture moderne des enjeux financiers et technologiques.",
  },
]

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#accueil"
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="Hachicha Advisory, accueil"
    >
      <img className="logo-image" src={logoImage} alt="" />
      <span>
        HACHICHA<span>-ADVISORY</span>
      </span>
    </a>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formStatus, setFormStatus] = useState<FormStatus>("idle")
  const [formError, setFormError] = useState("")
  const sendingRef = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) =>
            entry.isIntersecting && entry.target.classList.add("visible"),
        ),
      { threshold: 0.12 },
    )
    document
      .querySelectorAll(".reveal")
      .forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Guard against double submission (double click, Enter pressed twice).
    if (sendingRef.current) return
    sendingRef.current = true

    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    setFormStatus("sending")
    setFormError("")

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean
        error?: string
      } | null
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || DEFAULT_SEND_ERROR)
      }
      form.reset()
      setFormStatus("sent")
    } catch (error) {
      setFormError(
        error instanceof TypeError
          ? DEFAULT_SEND_ERROR
          : (error as Error).message || DEFAULT_SEND_ERROR,
      )
      setFormStatus("error")
    } finally {
      sendingRef.current = false
    }
  }

  return (
    <main>
      <header className="site-header">
        <div className="nav-shell">
          <Logo />
          <nav
            className={`main-nav ${menuOpen ? "open" : ""}`}
            aria-label="Navigation principale"
          >
            <a href="#accueil" onClick={closeMenu}>
              Accueil
            </a>
            <a href="#cabinet" onClick={closeMenu}>
              À propos
            </a>
            <a href="#services" onClick={closeMenu}>
              Services
            </a>
            <a href="#incubateur" onClick={closeMenu}>
              Startup
            </a>
            <a href="#contact" onClick={closeMenu}>
              Contact
            </a>
            <div className="mobile-actions">
              <a
                className="button button-dark"
                href="#contact"
                onClick={closeMenu}
              >
                Consultation <Icon name="arrow" />
              </a>
            </div>
          </nav>
          <div className="nav-actions">
            <a className="button button-dark nav-cta" href="#contact">
              Consultation <Icon name="arrow" size={17} />
            </a>
            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={24} />
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="accueil">
        <div className="hero-grid">
          <div className="hero-copy reveal">
            <p className="eyebrow">
              <span /> Conseil · Audit · Innovation
            </p>
            <h1>
              Votre partenaire stratégique pour la <em>réussite</em> et le
              développement de votre entreprise.
            </h1>
            <p className="hero-lead">
              Nous transformons la complexité financière en décisions claires et
              durables, en conjuguant expertise, vision stratégique et
              innovation.
            </p>
            <div className="hero-actions">
              <a className="button button-green" href="#services">
                Découvrir nos services <Icon name="arrow" />
              </a>
              <a className="text-link" href="#contact">
                Demander une consultation <Icon name="arrow" size={17} />
              </a>
            </div>
            <div className="hero-trust">
              <span>
                <Icon name="check" size={15} /> Conseil sur mesure
              </span>
              <span>
                <Icon name="check" size={15} /> Vision à long terme
              </span>
              <span>
                <Icon name="check" size={15} /> Expertise multidisciplinaire
              </span>
            </div>
          </div>
          <div className="hero-visual reveal">
            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?auto=format&fit=crop&w=1200&q=88"
                alt="Équipe de conseil en réunion stratégique dans un bureau moderne"
              />
              <span className="image-credit">
                Photo: Rodeo Project Management Software / Unsplash
              </span>
            </div>
            <div className="insight-card">
              <span className="insight-icon">
                <Icon name="finance" size={22} />
              </span>
              <div>
                <small>Notre approche</small>
                <strong>
                  Analyser. Conseiller.
                  <br />
                  Faire grandir.
                </strong>
              </div>
            </div>
            <div className="shape-dots" aria-hidden="true" />
          </div>
        </div>
        <div className="scroll-cue">
          <span /> Explorer notre expertise
        </div>
      </section>

      <section className="about section" id="cabinet">
        <div className="container about-grid">
          <div className="section-heading reveal">
            <p className="eyebrow">
              <span /> Le cabinet
            </p>
            <h2>
              Une expertise qui donne de la <em>perspective</em> à vos
              ambitions.
            </h2>
          </div>
          <div className="about-intro reveal">
            <p className="large-copy">
              HACHICHA-ADVISORY accompagne les entreprises et les entrepreneurs
              dans leurs enjeux financiers, fiscaux, comptables et stratégiques.
            </p>
            <p>
              Notre approche réunit précision technique, proximité et
              compréhension approfondie de votre activité. Nous construisons des
              solutions pragmatiques qui sécurisent aujourd’hui et préparent
              demain.
            </p>
            <a className="text-link" href="#contact">
              Échanger avec nos experts <Icon name="arrow" size={17} />
            </a>
          </div>
        </div>
        <div className="container values-grid">
          {values.map((value, index) => (
            <article className="value-card reveal" key={value.title}>
              <span className="card-number">0{index + 1}</span>
              <span className="icon-box">
                <Icon name={value.icon} size={25} />
              </span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
        <div className="container mission-panel reveal">
          <div>
            <span className="panel-label">Notre mission</span>
            <p>
              Éclairer vos décisions et renforcer durablement la performance de
              votre organisation.
            </p>
          </div>
          <div>
            <span className="panel-label">Notre vision</span>
            <p>
              Faire du conseil un véritable levier de confiance, d’innovation et
              de croissance.
            </p>
          </div>
          <div>
            <span className="panel-label">Notre expertise</span>
            <p>
              Une lecture transversale des enjeux financiers, réglementaires et
              entrepreneuriaux.
            </p>
          </div>
        </div>
      </section>

      <section className="services section" id="services">
        <div className="container">
          <div className="section-top reveal">
            <div className="section-heading">
              <p className="eyebrow">
                <span /> Nos services
              </p>
              <h2>
                Une expertise globale.
                <br />
                <em>Un seul partenaire.</em>
              </h2>
            </div>
            <p>
              Des expertises complémentaires pour accompagner chaque étape de
              votre développement, de la conformité à l’innovation.
            </p>
          </div>
          <div className="services-grid">
            {services.map((service, index) => (
              <article className="service-card reveal" key={service.title}>
                <div className="service-top">
                  <span className="service-icon">
                    <Icon name={service.icon} size={28} />
                  </span>
                  <small>0{index + 1}</small>
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="incubator section" id="incubateur">
        <div className="container incubator-grid">
          <div className="incubator-visual reveal">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <div className="incubator-symbol">
              <Icon name="incubator" size={68} />
            </div>
            <div className="float-label label-one">
              <span>01</span> Structurer
            </div>
            <div className="float-label label-two">
              <span>02</span> Accélérer
            </div>
            <div className="float-label label-three">
              <span>03</span> Développer
            </div>
          </div>
          <div className="incubator-copy reveal">
            <p className="eyebrow light">
              <span /> Startup
            </p>
            <h2>
              De l’idée à une entreprise <em>prête à grandir.</em>
            </h2>
            <p>
              Nous accompagnons les porteurs de projets dans la structuration,
              la validation et le déploiement de leur entreprise. Un suivi
              concret, pensé pour transformer une vision en trajectoire viable.
            </p>
            <ul>
              <li>
                <Icon name="check" size={17} /> Structuration du projet et du
                modèle économique
              </li>
              <li>
                <Icon name="check" size={17} /> Mentorat entrepreneurial et
                pilotage stratégique
              </li>
              <li>
                <Icon name="check" size={17} /> Préparation financière et
                business development
              </li>
              <li>
                <Icon name="check" size={17} /> Accompagnement dans les phases
                de croissance
              </li>
            </ul>
            <a className="button button-green" href="#contact">
              Présenter mon projet <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      <section className="why section">
        <div className="container why-grid">
          <div className="why-heading section-heading reveal">
            <p className="eyebrow">
              <span /> Pourquoi nous choisir
            </p>
            <h2>
              Le conseil autrement&nbsp;: précis, proche et{" "}
              <em>tourné vers l’avenir.</em>
            </h2>
            <div className="quote-card">
              <Icon name="quote" size={27} />
              <p>Chaque entreprise est unique. Notre conseil l’est aussi.</p>
            </div>
          </div>
          <div className="reasons">
            {[
              [
                "01",
                "Professionnalisme",
                "Une méthode rigoureuse, claire et responsable à chaque étape.",
              ],
              [
                "02",
                "Expertise multidisciplinaire",
                "Une vision complète pour traiter les enjeux dans leur ensemble.",
              ],
              [
                "03",
                "Accompagnement personnalisé",
                "Une écoute active et des solutions adaptées à votre réalité.",
              ],
              [
                "04",
                "Vision stratégique",
                "Des décisions éclairées, alignées avec vos objectifs à long terme.",
              ],
              [
                "05",
                "Innovation",
                "Une approche ouverte aux nouveaux modèles et technologies.",
              ],
            ].map(([number, title, text]) => (
              <article className="reason reveal" key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="container contact-shell reveal">
          <div className="contact-copy">
            <p className="eyebrow light">
              <span /> Parlons de votre projet
            </p>
            <h2>
              Construisons votre prochaine <em>étape.</em>
            </h2>
            <p>
              Expliquez-nous votre besoin. Notre équipe vous recontactera pour
              organiser un premier échange confidentiel.
            </p>
            <div className="contact-points">
              <div>
                <span>
                  <Icon name="mail" />
                </span>
                <p>
                  <small>Email</small>
                  <a href="mailto:ramzi.hachicha@hachichaadvisory.com">ramzi.hachicha@hachichaadvisory.com</a>
                </p>
              </div>
              <div>
                <span>
                  <Icon name="phone" />
                </span>
                <p>
                  <small>Téléphone</small>
                  <a href="tel:+21620101008">(+216) 20 101 008</a>
                </p>
              </div>
            </div>
            <div className="social-row">
              <span>Nous suivre</span>
              <a href="https://www.linkedin.com/in/ramzi-hachicha-78882b137/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Icon name="linkedin" size={18} />
              </a>
            </div>
          </div>
          <form className="contact-form" onSubmit={submit}>
            <div className="field-row">
              <label>
                <span>Nom complet</span>
                <div className="input-wrap">
                  <Icon name="user" size={17} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </label>
              <label>
                <span>Adresse email</span>
                <div className="input-wrap">
                  <Icon name="mail" size={17} />
                  <input
                    type="email"
                    name="email"
                    placeholder="nom@entreprise.com"
                    required
                  />
                </div>
              </label>
            </div>
            <div className="field-row">
              <label>
                <span>Téléphone</span>
                <div className="input-wrap">
                  <Icon name="phone" size={17} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+216 — — — — — —"
                  />
                </div>
              </label>
              <label>
                <span>Service souhaité</span>
                <select name="service" defaultValue="" required>
                  <option value="" disabled>
                    Sélectionner un service
                  </option>
                  {services.map((service) => (
                    <option key={service.title}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Votre message</span>
              <textarea
                name="message"
                placeholder="Parlez-nous brièvement de votre besoin..."
                rows={4}
                required
              />
            </label>
            {/* Honeypot: hidden from visitors, catches spam bots. */}
            <input
              className="form-honeypot"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <button
              className="button button-green form-submit"
              type="submit"
              disabled={formStatus === "sending"}
              aria-busy={formStatus === "sending"}
            >
              {formStatus === "sending" ? "Envoi en cours..." : "Envoyer ma demande"}{" "}
              <Icon name="arrow" />
            </button>
            {formStatus === "sent" && (
              <p className="form-success" role="status">
                <Icon name="check" size={16} /> Votre demande a bien été
                envoyée. Nous vous remercions et revenons vers vous rapidement.
              </p>
            )}
            {formStatus === "error" && (
              <p className="form-error" role="alert">
                <Icon name="close" size={16} /> {formError}
              </p>
            )}
            <small className="form-note">
              <Icon name="shield" size={14} /> Vos informations sont traitées de
              manière strictement confidentielle.
            </small>
          </form>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <Logo light />
            <p>
              Conseil financier, audit et accompagnement stratégique au service
              d’une croissance durable.
            </p>
            <a className="footer-link" href="#contact">
              Planifier un échange <Icon name="arrow" size={16} />
            </a>
          </div>
          <div>
            <h4>Navigation</h4>
            <a href="#accueil">Accueil</a>
            <a href="#cabinet">À propos</a>
            <a href="#services">Services</a>
            <a href="#incubateur">Incubateur</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <h4>Nos services</h4>
            {services.map((service) => (
              <a href="#services" key={service.title}>
                {service.title}
              </a>
            ))}
          </div>
          <div>
            <h4>Contact</h4>
            <p>Pour toute demande, utilisez notre formulaire de contact.</p>
            <a className="social-button" href="https://www.linkedin.com/in/ramzi-hachicha-78882b137/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Icon name="linkedin" size={18} />
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} HACHICHA-ADVISORY. Tous droits
            réservés.
          </span>
          <a href="#">Politique de confidentialité</a>
        </div>
      </footer>
    </main>
  )
}
