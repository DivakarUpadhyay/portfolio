'use client'
import { useReveal } from '@/hooks/useReveal'
import { showToast } from './Toast'

interface Profile {
  email: string; phone: string; lineId: string
  location: string; locationDetail: string; availability: string
  github?: string; linkedin?: string
}

function copy(text: string) {
  navigator.clipboard?.writeText(text)
    .then(() => showToast(`Copied: ${text}`))
    .catch(() => showToast('Copy failed'))
}

export default function Contact({ profile }: { profile: Profile }) {
  const { ref: headRef  } = useReveal()
  const { ref: leftRef  } = useReveal()
  const { ref: rightRef } = useReveal()

  return (
    <section id="contact" className="section">
      <div className="section-inner">
        <div className="section-head reveal" ref={headRef}>
          <div className="section-label">Let&apos;s Connect</div>
          <h2 className="section-title">Ready to <em>collaborate</em></h2>
        </div>

        <div className="contact-grid">
          <div ref={leftRef} className="reveal">
            <div className="contact-message">
              Got an interesting<br /><em>project?</em> Let&apos;s talk.
            </div>
            <p className="contact-text">
              I&apos;m based in New Taipei City, Taiwan and open to new opportunities,
              challenging projects, and collaborations in enterprise software, fintech,
              or any domain that demands clean architecture and reliable systems.
            </p>
            <div className="contact-avail">
              <div className="avail-dot" />
              {profile.availability}
            </div>
          </div>

          <div ref={rightRef} className="contact-cards reveal">
            <div className="contact-card" onClick={() => copy(profile.email)}>
              <div className="contact-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,12 2,6"/>
                </svg>
              </div>
              <div>
                <div className="contact-key">Email</div>
                <div className="contact-val">{profile.email}</div>
                <div className="contact-hint">Click to copy</div>
              </div>
            </div>

            <div className="contact-card" onClick={() => copy(profile.phone)}>
              <div className="contact-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.19h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82A16 16 0 0 0 15.1 16l.75-.75a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.5z"/>
                </svg>
              </div>
              <div>
                <div className="contact-key">Phone / WhatsApp</div>
                <div className="contact-val">{profile.phone}</div>
                <div className="contact-hint">Click to copy</div>
              </div>
            </div>

            {profile.lineId && (
              <a href={`https://line.me/ti/p/~${profile.lineId}`} target="_blank" rel="noopener" className="contact-card" style={{ textDecoration: 'none' }}>
                <div className="contact-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-key">Line ID</div>
                  <div className="contact-val">{profile.lineId}</div>
                  <div className="contact-hint">Open in Line →</div>
                </div>
              </a>
            )}

            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener" className="contact-card" style={{ textDecoration: 'none' }}>
                <div className="contact-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-key">LinkedIn</div>
                  <div className="contact-val">divakar-upadhyay</div>
                  <div className="contact-hint">View profile →</div>
                </div>
              </a>
            )}

            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener" className="contact-card" style={{ textDecoration: 'none' }}>
                <div className="contact-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-key">GitHub</div>
                  <div className="contact-val">divakarupadhyay</div>
                  <div className="contact-hint">View repositories →</div>
                </div>
              </a>
            )}

            <div className="contact-card contact-card-static">
              <div className="contact-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <div className="contact-key">Location</div>
                <div className="contact-val">{profile.location}</div>
                <div className="contact-hint">{profile.locationDetail}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
