import { NextRequest, NextResponse } from 'next/server'

interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  company?: string
  software?: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()

    // Validate required fields (company is optional)
    if (!body.firstName || !body.lastName || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Tutti i campi obbligatori devono essere compilati' },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    // Get GitHub config
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_REPO = process.env.GITHUB_REPO

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      console.error('Missing GitHub configuration')
      return NextResponse.json(
        { error: 'Errore di configurazione. Contatta l\'amministratore.' },
        { status: 500 }
      )
    }

    const [owner, repo] = GITHUB_REPO.split('/')
    if (!owner || !repo) {
      console.error('Invalid GITHUB_REPO format')
      return NextResponse.json(
        { error: 'Errore di configurazione. Contatta l\'amministratore.' },
        { status: 500 }
      )
    }

    // Prepare contact data
    const fullName = `${body.firstName} ${body.lastName}`
    const timestamp = new Date()
    const dateStr = timestamp.toLocaleDateString('it-IT', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Save to GitHub (free database storage)
    const contactData = `# Nouveau contact

**Nom (ou pseudo):** ${body.firstName}  
**Ville - Pays :** ${body.lastName}  
**Courriel :** ${body.email}  
**Contexte, association, établissement exercé :** ${body.company || 'Non fornita'}  
**Logiciel utilisé :** ${body.software || 'Non fornito'}  
**Date :** ${dateStr}

## Message

${body.message}

---
*Ricevuto dalla landing page*
`

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: `📧 ${fullName}${body.company ? ' - ' + body.company : ''}`,
          body: contactData,
          labels: ['contatto'],
        }),
      }
    )

    if (!response.ok) {
      console.error('Failed to save contact')
      return NextResponse.json(
        { error: 'Errore durante il salvataggio. Riprova.' },
        { status: 500 }
      )
    }

    // Success - GitHub will send email notification automatically
    return NextResponse.json(
      {
        success: true,
        message: 'Grazie! Ti contatteremo a breve.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Errore imprevisto. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
