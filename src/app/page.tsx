import Script from 'next/script'
import ThemeRotator from '@/components/ThemeRotator'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Experience from '@/components/Experience'
import Projects from '@/components/Projects'
import DemoProjects from '@/components/DemoProjects'
import Education from '@/components/Education'
import ResumeSection from '@/components/ResumeSection'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import { sbGetPortfolio, sbGetDemoProjects } from '@/lib/supabase'

// JSON fallbacks — used instantly if Supabase is unreachable
import profileFb from '../../data/profile.json'
import skillsFb from '../../data/skills.json'
import experienceFb from '../../data/experience.json'
import projectsFb from '../../data/projects.json'
import demoProjectsFb from '../../data/demo-projects.json'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Divakar R. Upadhyay',
  givenName: 'Divakar',
  familyName: 'Upadhyay',
  jobTitle: 'Sr. Software Engineer',
  description:
    'Sr. Software Engineer with 8+ years in Microsoft .NET, specialising in C#, AngularJS, MSSQL, SSRS, Clean Architecture, and Web3. Built enterprise systems for Acer Group, Bajaj FinServ, HealthAssure, IGI. Based in Taiwan — Gold Card Holder.',
  url: 'https://divakarupadhyay.dev',
  image: 'https://divakarupadhyay.dev/candidatepic/DivakarUpadhyay.jpg',
  email: 'divakarup1991@gmail.com',
  telephone: '+886987291325',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'New Taipei City',
    addressRegion: 'Taiwan',
    addressCountry: 'TW',
  },
  sameAs: [
    'https://github.com/divakarupadhyay',
    'https://linkedin.com/in/divakar-upadhyay',
  ],
  knowsAbout: [
    'C#', '.NET', '.NET Core', 'VB.Net', 'AngularJS', 'Next.js',
    'MSSQL', 'SSRS', 'SSIS', 'Crystal Reports', 'Entity Framework', 'Dapper',
    'REST API', 'SOAP API', 'Solidity', 'Web3', 'Clean Architecture',
    'Azure DevOps', 'GitHub Actions', 'Umbraco CMS', 'Salesforce API',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'Ample Group Global',
    url: 'https://amplegroupglobal.com',
  },
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'University',
    description: 'MSc Computer Science',
  },
  nationality: 'Indian',
  workLocation: {
    '@type': 'Place',
    name: 'New Taipei City, Taiwan',
  },
}

export default async function Page() {
  // Fetch all data in parallel — falls back to JSON silently if Supabase is unreachable
  const [profile, skills, experience, projects, demoProjects] = await Promise.all([
    sbGetPortfolio('profile',    profileFb),
    sbGetPortfolio('skills',     skillsFb),
    sbGetPortfolio('experience', experienceFb),
    sbGetPortfolio('projects',   projectsFb),
    sbGetDemoProjects(demoProjectsFb),
  ])

  return (
    <>
      <Script
        id="json-ld-person"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="beforeInteractive"
      />
      <ThemeRotator />
      <Toast />
      <Nav initials={profile.initials} resumePdf={profile.resumePdf} />

      <main>
        <Hero profile={profile} />
        <div className="divider" />
        <About profile={profile} skills={skills} />
        <div className="divider" />
        <Experience items={experience} />
        <div className="divider" />
        <DemoProjects items={demoProjects} />
        <div className="divider" />
        <Projects items={projects} />
        <div className="divider" />
        <Education />
        <div className="divider" />
        <ResumeSection resumePdf={profile.resumePdf} />
        <div className="divider" />
        <Contact profile={profile} />
      </main>

      <Footer name={profile.name} resumePdf={profile.resumePdf} github={profile.github} linkedin={profile.linkedin} />
    </>
  )
}
