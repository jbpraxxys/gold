export interface MarketingInput {
  /** Property address or identifying name */
  propertyAddress: string
  /** Key property features (bedrooms, bathrooms, sqft, etc.) */
  features: string[]
  /** Unique selling points */
  highlights: string[]
  /** Target audience (e.g. 'first-time buyers', 'luxury investors') */
  audience?: string
}

export type MarketingTone = 'professional' | 'enthusiastic' | 'luxury' | 'casual'

export interface MarketingDescriptions {
  professional: string
  enthusiastic: string
  luxury: string
  casual: string
}

export interface MarketingOutput {
  success: boolean
  propertyAddress: string
  descriptions: MarketingDescriptions
  socialCaptions: string[]
  emailSubjects: string[]
}

// ── Template generators ────────────────────────────────────────────────

function generateDescription(
  property: string,
  features: string[],
  highlights: string[],
  audience: string,
  tone: MarketingTone,
): string {
  const featureStr = features.join(', ')
  const highlightStr = highlights.join(', ')
  const audienceStr = audience || 'potential buyers'

  const openers: Record<MarketingTone, string> = {
    professional: `Welcome to ${property}, a distinguished residence offering ${featureStr}.`,
    enthusiastic: `Don't miss your chance to call ${property} home! This incredible property features ${featureStr}!`,
    luxury: `Step into the extraordinary at ${property}, an exceptional estate showcasing ${featureStr}.`,
    casual: `Check out ${property} — it's got ${featureStr} and so much more.`,
  }

  const bodies: Record<MarketingTone, string> = {
    professional: `This thoughtfully designed property is perfect for ${audienceStr} seeking comfort, style, and convenience. Notable highlights include ${highlightStr}, making it a standout choice in the market. Schedule a private viewing today to experience everything this home has to offer.`,
    enthusiastic: `This is THE one ${audienceStr} have been waiting for! With amazing features like ${highlightStr}, this property is packed with value and ready for its next chapter. Act fast — homes like this don't last long! Call today to schedule your tour!`,
    luxury: `Meticulously curated for the discerning ${audienceStr}, this residence redefines modern elegance. Distinguished by ${highlightStr}, every detail has been carefully considered. An exclusive offering for those who demand the finest in quality and design. Private showings available upon request.`,
    casual: `For ${audienceStr}, this spot has a lot going for it. You've got ${highlightStr} — which is a pretty sweet deal. If you've been hunting for something that just works, this might be it. Swing by and take a look!`,
  }

  const closers: Record<MarketingTone, string> = {
    professional: 'Contact us today for more information or to schedule a private showing.',
    enthusiastic: 'Call or text now before someone else snags this gem!',
    luxury: 'Inquire within for a confidential consultation and private tour.',
    casual: 'Hit us up if you want to check it out. No pressure! 😊',
  }

  return `${openers[tone]} ${bodies[tone]} ${closers[tone]}`
}

function generateSocialCaptions(
  property: string,
  highlights: string[],
  audience: string,
): string[] {
  const audienceStr = audience || 'homebuyers'

  return [
    `🏡 Just listed! ${property} — features include ${highlights.slice(0, 3).join(', ')}. Perfect for #${audienceStr.replace(/\s+/g, '')}! #RealEstate #JustListed`,
    `✨ New on the market: ${property}. ${highlights[0] ?? 'Must see!'} Schedule your tour today. #DreamHome #TopRealty`,
    `📍 Location, luxury, and lifestyle — ${property} has it all. ${highlights.slice(0, 2).join(' and ')}. DM us for details! #PropertyGoals`,
    `🔑 Your next chapter starts at ${property}. ${highlights.join(' • ')}. Let's make it yours. #HomeSweetHome`,
    `📸 Sneak peek: ${property} is turning heads. With ${highlights.slice(0, 3).join(', ')}, this one won't last. #NewListing #RealEstatePH`,
  ]
}

function generateEmailSubjects(
  property: string,
  highlights: string[],
  audience: string,
): string[] {
  const audienceStr = audience || 'Buyers'

  return [
    `New Listing Alert: ${property}`,
    `${property} — A Must-See for ${audienceStr}`,
    `Your Dream Home Awaits at ${property}`,
    `Just Hit the Market: ${property} | ${highlights[0] ?? 'Exclusive Preview'}`,
    `${audienceStr} — Don't Miss ${property} with ${highlights.slice(0, 2).join(' & ')}`,
    `Exclusive Preview: ${property}`,
    `🏡 Hot New Listing: ${property} — Schedule Your Tour`,
  ]
}

// ── Main export ─────────────────────────────────────────────────────────

/**
 * Generate marketing copy for a property across multiple tones.
 * Returns descriptions, social media captions, and email subject lines.
 * This is a text-only tool — no files are generated.
 */
export async function executeMarketing(input: MarketingInput): Promise<MarketingOutput> {
  const { propertyAddress, features, highlights, audience = 'homebuyers' } = input

  const tones: MarketingTone[] = ['professional', 'enthusiastic', 'luxury', 'casual']
  const descriptions = Object.fromEntries(
    tones.map((tone) => [tone, generateDescription(propertyAddress, features, highlights, audience, tone)]),
  ) as unknown as MarketingDescriptions

  const socialCaptions = generateSocialCaptions(propertyAddress, highlights, audience)
  const emailSubjects = generateEmailSubjects(propertyAddress, highlights, audience)

  return {
    success: true,
    propertyAddress,
    descriptions,
    socialCaptions,
    emailSubjects,
  }
}
