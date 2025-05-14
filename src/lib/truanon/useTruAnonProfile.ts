import {useCallback, useEffect, useState} from 'react'
import {TRUANON_AUTH_TOKEN, TRUANON_SERVICE} from '@env'

const TRUANON_AUTH_HEADER = {
  Authorization: `Bearer ${TRUANON_AUTH_TOKEN}`,
}

export type DataConfiguration = {
  dataPointName: string
  displayValue: string
  dataPointIconClass: string
  dataPointType: string
  dataPointKind: string
  displayString: string
}

export type TruAnonProfile = {
  authorRank: string
  authorRankScore?: string
  authorFullName?: string
  authorTitle?: string
  authorAgeBadge?: string
  authorPhoto?: string
  truAnonUrl?: string
  dataConfigurations: DataConfiguration[]
}

export type TruAnonDetails = {
  truAnonUrl?: string
  zodiac?: string
  location?: string
  ageRange?: string
  profileLink?: string
  socials?: {
    dataPointName: string
    displayValue: string
    dataPointIconClass: string
  }[]
}

const baseUrl = 'https://truanon.com/api'
// const baseUrl = 'http://127.0.0.1:5555/cgi-bin/WebObjects/TruAnon.woa/wa'

export function useTruAnonProfile(handle: string) {
  const [data, setData] = useState<TruAnonProfile | null>(null)
  const [prefs, setPrefs] = useState({
    wants_verified: true,
    wants_personal: true,
    wants_social: true,
    wants_private: false,
  })
  const [details, setDetails] = useState<TruAnonDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const safeHandle = String(handle).split(':')[0]
      const prefsUrl = `https://devhauz.truanon.com/api/prefs/${safeHandle}`

      let loadedPrefs = null
      try {
        const prefsRes = await fetch(prefsUrl)
        if (prefsRes.ok) {
          loadedPrefs = await prefsRes.json()
          setPrefs({
            wants_verified: !!loadedPrefs.wants_verified,
            wants_personal: !!loadedPrefs.wants_personal,
            wants_social: !!loadedPrefs.wants_social,
            wants_private: !!loadedPrefs.wants_private,
          })
        } else {
          console.log('[TAO] No prefs found.')
        }
      } catch (e) {
        console.warn('[TAO] Pref fetch failed:', e.message)
      }

      if (!loadedPrefs?.wants_verified) {
        console.log('[TAO] Showing Unknown badge (no verify).')
        setData({authorRank: 'Unknown', dataConfigurations: []})
        setDetails({})
        return
      }

      const profileUrl = `${baseUrl}/get_profile?id=${safeHandle}&service=${TRUANON_SERVICE}`
      const res = await fetch(profileUrl, {headers: TRUANON_AUTH_HEADER})
      const text = await res.text()

      let json
      try {
        json = JSON.parse(text)
      } catch (err) {
        throw new Error('Invalid JSON: ' + text.slice(0, 100))
      }

      console.log('[TruAnon] Fetched Proflile get_profile URL:', profileUrl)

      if (!res.ok || json.error || json.type === 'error') {
        console.log('[TruAnon] API Error:', json)
        setData({authorRank: 'Unknown', dataConfigurations: []})
        setDetails({})
        return
      }

      const profile: TruAnonProfile = {
        authorRank: json.authorRank,
        authorRankScore: json.authorRankScore,
        authorFullName: json.authorFullName,
        authorTitle: json.authorTitle,
        authorAgeBadge: json.authorAgeBadge,
        authorPhoto: json.authorPhoto,
        truAnonUrl: json.dataConfigurations?.find(
          d => d.dataPointType === 'truanon',
        )?.displayValue,
        dataConfigurations: json.dataConfigurations || [],
      }

      const extract = (type: string, kind?: string) =>
        profile.dataConfigurations.find(
          d => d.dataPointType === type && (!kind || d.dataPointKind === kind),
        )?.displayValue

      const socials =
        profile.dataConfigurations
          .filter(
            d =>
              d.dataPointKind === 'social' &&
              d.displayValue &&
              !['truanon', 'peepletok', 'bskyapp'].includes(
                (d.dataPointType || '').toLowerCase(),
              ),
          )
          .map(d => ({
            dataPointName: d.dataPointName || 'Link',
            displayValue: d.displayValue,
            dataPointIconClass:
              {
                medium: 'fab fa-medium',
                tiktok: 'fab fa-tiktok',
              }[d.dataPointType?.toLowerCase() || ''] ||
              d.dataPointIconClass ||
              'fas fa-link',
          })) || []

      setData(profile)
      setDetails({
        truAnonUrl: extract('truanon'),
        profileLink: extract('truanon'),
        zodiac: extract('birthday', 'personal'),
        location: extract('location', 'personal'),
        ageRange: extract('birthday', 'personal'),
        socials,
      })
    } catch (err: any) {
      console.warn('[TruAnon] Fetch failed:', err.message)
      setError(err.message)
      setData({authorRank: 'Unknown', dataConfigurations: []})
      setDetails({})
    } finally {
      setLoading(false)
    }
  }, [handle])

  useEffect(() => {
    if (handle) fetchProfile()
  }, [handle, fetchProfile])

  return {data, details, prefs, error, loading, refetch: fetchProfile}
}

export async function getVerifyLink(handle: string): Promise<{
  verifyUrl?: string
  assignedUrl?: string
  truAnonDetails?: any
}> {
  if (!handle) return {}

  // handle = 'hannab.bsky.social'

  const profileUrl = `${baseUrl}/get_profile?id=${handle}&service=${TRUANON_SERVICE}`

  try {
    const profileRes = await fetch(profileUrl, {headers: TRUANON_AUTH_HEADER})
    console.log('[TruAnon] Fetched Editing get_profile URL:', profileUrl)

    const profileJson = await profileRes.json()

    const isUnknown =
      profileJson?.type === 'error' && profileJson?.title === 'Member Unknown'

    if (!isUnknown) {
      const assignedUrl = profileJson?.dataConfigurations?.find(
        (d: any) => d.dataPointType === 'truanon',
      )?.displayValue

      return {
        verifyUrl: undefined,
        assignedUrl,
        truAnonDetails: profileJson,
      }
    }

    const tokenUrl = `${baseUrl}/get_token?id=${handle}&service=${TRUANON_SERVICE}`
    const tokenRes = await fetch(tokenUrl, {headers: TRUANON_AUTH_HEADER})
    console.log('[TruAnon] Fetched Token Link get_token URL', tokenUrl)

    const tokenJson = await tokenRes.json()
    if (tokenJson?.id) {
      const verifyUrl = `${baseUrl}/verifyProfile?id=${handle}&service=${TRUANON_SERVICE}&token=${tokenJson.id}`
      console.log('[TruAnon] Generated public confirmation URL:', verifyUrl)
      return {
        verifyUrl,
        assignedUrl: undefined,
        truAnonDetails: undefined,
      }
    } else {
      console.warn('[TruAnon] No token received for unknown profile')
    }
  } catch (err) {
    console.error('[TruAnon] Error fetching verification info:', err)
  }

  return {}
}
