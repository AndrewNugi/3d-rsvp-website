"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";

const DEGREES_PER_MS = 360 / 10000; // matches the old 10s-per-rotation speed

interface PhotoCard {
  id: string
  caption: string
  src?: string   // real photo path e.g. '/photos/beach.jpg'; omit to use gradient+icon fallback
  gradient: string
  icon: string
}

const PHOTO_CARDS: PhotoCard[] = [
  { id: 'photo-1', src:'/photos/IMG_7806.JPG', caption: 'Venue: Karen', gradient: 'linear-gradient(145deg, #ffd0e8, #ff9ecf)', icon: '💍' },
  { id: 'photo-2', src:'/photos/IMG_7828.JPG', caption: 'Date: 19th September', gradient: 'linear-gradient(145deg, #ffe3f0, #ffb6d9)', icon: '📅' },
  { id: 'photo-3', src:'/photos/IMG_7835.JPG', caption: 'Theme: Burgundy', gradient: 'linear-gradient(145deg, #fff0f7, #ff8ec5)', icon: '💕' },
]

type TiltCardProps = {
  shadowUrl: string;
  backgroundUrl: string;
  cutoutUrl: string;
  borderClass?: string;
  title: string;
  text: string;
};

function TiltCard({
  shadowUrl,
  backgroundUrl,
  cutoutUrl,
  borderClass = "",
  title,
  text,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const targetRotate = useRef({ rotateX: 0, rotateY: 0 });
  const currentRotate = useRef({ rotateX: 0, rotateY: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const angle = 20;

    const remap = (value: number, oldMax: number, newMax: number) => {
      const newValue = ((value + oldMax) * (newMax * 2)) / (oldMax * 2) - newMax;
      return Math.min(Math.max(newValue, -newMax), newMax);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = (rect.left + rect.right) / 2;
      const centerY = (rect.top + rect.bottom) / 2;
      const posX = event.clientX - centerX;
      const posY = event.clientY - centerY;
      const x = remap(posX, rect.width / 2, angle);
      const y = remap(posY, rect.height / 2, angle);
      targetRotate.current = { rotateY: x, rotateX: -y };
    };

    const handleMouseOut = () => {
      targetRotate.current = { rotateX: 0, rotateY: 0 };
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseout", handleMouseOut);

    const lerp = (start: number, end: number, amount: number) =>
      (1 - amount) * start + amount * end;

    const update = () => {
      currentRotate.current.rotateX = lerp(
        currentRotate.current.rotateX,
        targetRotate.current.rotateX,
        0.05
      );
      currentRotate.current.rotateY = lerp(
        currentRotate.current.rotateY,
        targetRotate.current.rotateY,
        0.05
      );
      card.style.setProperty("--rotateX", `${currentRotate.current.rotateX}deg`);
      card.style.setProperty("--rotateY", `${currentRotate.current.rotateY}deg`);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseout", handleMouseOut);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`card${borderClass ? ` ${borderClass}` : ""}`}
      style={{ "--rotateX": "0deg", "--rotateY": "0deg" } as CSSProperties}
    >
      <div className="shadow" style={{ "--url": `url('${shadowUrl}')` } as CSSProperties} />
      <div
        className="image background"
        style={{ "--url": `url('${backgroundUrl}')` } as CSSProperties}
      />
      <div
        className="image cutout"
        style={{ "--url": `url('${cutoutUrl}')` } as CSSProperties}
      />
      <div className="content">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const isSpinning = !isOpen;

  useEffect(() => {
    if (isSpinning) {
      let last = performance.now();

      const step = (now: number) => {
        const delta = now - last;
        last = now;
        setAngle((prev) => prev + delta * DEGREES_PER_MS);
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);

      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    } else {
      // Ease forward to the next full rotation so it settles facing front,
      // rather than snapping straight back to 0deg.
      setAngle((prev) => Math.ceil(prev / 360) * 360 || 360);
    }
  }, [isSpinning]);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
  };

  const [rsvpName, setRsvpName] = useState("");
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const handleRsvpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = rsvpName.trim();
    if (!trimmedName || rsvpAttending === null) return;

    setRsvpError(null);
    setRsvpSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, attending: rsvpAttending }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setRsvpError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setRsvpSubmitted(true);
    } catch {
      setRsvpError("Something went wrong. Please try again.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const invitationSectionRef = useRef<HTMLElement | null>(null);
  const scrollToInvitation = () => {
    invitationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="hero-section">
        <div className={`mailbox-message${isOpen ? " hidden" : ""}`}>
          <p>You Got Mail!!! Click the envelope to open</p>
        </div>
        <div
          className="envelope"
          onClick={handleClick}
          style={{
            transform: `rotateY(${angle}deg)`,
            transition: isSpinning ? "none" : "transform 1s ease",
          }}
        >
          <div className={`seal${isOpen ? " hidden" : ""}`}>MM</div>
          <div className="front">
            <h1>You're Invited!</h1>
          </div>
          <div className="inner"></div>
          <div className="bottom"></div>
          <div className={`flap${isOpen ? " open" : ""}`}></div>
          <div className={`photocards${isOpen ? " open" : ""}`}>
            <div className="photocard photocard-outer-left">
              <img src="/photos/IMG_7837.JPG" alt="Photo placeholder 1" />
            </div>
            <div className="photocard photocard-left">
              <img src="/photos/IMG_7836.JPG" alt="Photo placeholder 2" />
            </div>
            <div className="photocard photocard-center">
              <img src="/photos/IMG_7806.JPG" alt="Photo placeholder 3" />
            </div>
            <div className="photocard photocard-right">
              <img src="/photos/IMG_7828.JPG" alt="Photo placeholder 4" />
            </div>
            <div className="photocard photocard-outer-right">
              <img src="/photos/IMG_7835.JPG" alt="Photo placeholder 5" />
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`scroll-hint${isOpen ? "" : " hidden"}`}
          onClick={scrollToInvitation}
          aria-label="Scroll down to the invitation"
        >
          <span className="scroll-hint-label">Click for more info</span>
          <span className="scroll-hint-arrow">⌄</span>
        </button>
      </section>

      <section className="collage-and-card-section" ref={invitationSectionRef}>
        <div className="centered">
          <TiltCard
            shadowUrl="/photos/2B966C61-D91A-4D5A-BFB5-66571497FE23.jpg"
            backgroundUrl="/photos/IMG_7819.JPG"
            cutoutUrl="/photos/IMG_1777.png"
            borderClass="border-right-behind"
            title="You're Invited"
            text="We would love for you to come and join us in celebrating Makena's Graduation"
          />
        </div>

        <div className="collage-and-rsvp-column">
          <div className="hero-collage">
            {PHOTO_CARDS.map((photo, i) => (
              <div key={photo.id} className="collage-photo" style={{ '--delay': `${i * 0.3}s` } as CSSProperties}>
                <div className="photo-card-frame">
                  <div className="photo-card-image" style={photo.src ? undefined : { background: photo.gradient }} aria-hidden="true">
                    {photo.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.src} alt="" />
                    ) : (
                      <span>{photo.icon}</span>
                    )}
                  </div>
                  <span className="photo-card-caption">{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rsvp-card">
            <h2 className="rsvp-heading">RSVP</h2>
            <p className="rsvp-subheading">Let us know if you can celebrate with us!</p>

            {rsvpSubmitted ? (
              <div className="rsvp-success">
                <span className="rsvp-success-icon">{rsvpAttending ? "🎉" : "💌"}</span>
                <p>
                  {rsvpAttending
                    ? `Yay, ${rsvpName}! We can't wait to celebrate with you.`
                    : `Thanks for letting us know, ${rsvpName}. You'll be missed!`}
                </p>
                <button
                  type="button"
                  className="rsvp-reset"
                  onClick={() => setRsvpSubmitted(false)}
                >
                  Edit response
                </button>
              </div>
            ) : (
              <form className="rsvp-form" onSubmit={handleRsvpSubmit}>
                <label className="rsvp-field">
                  <span className="rsvp-label">Full name</span>
                  <input
                    type="text"
                    name="fullName"
                    className="rsvp-input"
                    placeholder="Your full name"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    required
                  />
                </label>

                <div className="rsvp-field">
                  <span className="rsvp-label">Will you be attending?</span>
                  <div className="rsvp-toggle" role="radiogroup" aria-label="Attendance">
                    <button
                      type="button"
                      className={`rsvp-toggle-btn${rsvpAttending === true ? " selected" : ""}`}
                      aria-pressed={rsvpAttending === true}
                      onClick={() => setRsvpAttending(true)}
                    >
                      Yes, I&apos;ll be there 🎉
                    </button>
                    <button
                      type="button"
                      className={`rsvp-toggle-btn decline${rsvpAttending === false ? " selected" : ""}`}
                      aria-pressed={rsvpAttending === false}
                      onClick={() => setRsvpAttending(false)}
                    >
                      Can&apos;t make it 💔
                    </button>
                  </div>
                </div>

                {rsvpError && <p className="rsvp-error">{rsvpError}</p>}

                <button
                  type="submit"
                  className="rsvp-submit"
                  disabled={!rsvpName.trim() || rsvpAttending === null || rsvpSubmitting}
                >
                  {rsvpSubmitting ? "Sending…" : "Send RSVP"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}