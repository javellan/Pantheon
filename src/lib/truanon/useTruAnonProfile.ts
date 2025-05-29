import {useCallback, useEffect, useState} from 'react'
import {TRUANON_AUTH_TOKEN, TRUANON_SERVICE} from '@env'

import {
  useTruAnonBadgeRankMutation,
  useTruanonPrefs,
  useTruanonPrefsMutation,
} from '#/state/queries/profile'

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

function getTruAnonBadgeStyle(
  authorRank: string,
  dataConfigurations: any[],
): 'Checkmark' | 'Ribbon' {
  const disallowed = ['Dangerous', 'Cautioned']
  if (disallowed.includes(authorRank)) return 'Checkmark'

  const hasTikTok = dataConfigurations?.some(d => d.dataPointType === 'tiktok')
  return hasTikTok ? 'Ribbon' : 'Checkmark'
}

export function useTruAnonProfile(handle: string, did?: string) {
  const [data, setData] = useState<TruAnonProfile | null>(null)
  const [details, setDetails] = useState<TruAnonDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const {mutateAsync: updateTruanonPrefs} = useTruanonPrefsMutation()
  const {mutate: setBadgeRank} = useTruAnonBadgeRankMutation()

  const {data: loadedPrefs} = useTruanonPrefs(did || '')

  const mergedPrefs = {
    wants_verified: false,
    wants_personal: true,
    wants_social: true,
    wants_private: false,
    ...loadedPrefs,
  }

  const shouldFetchProfile = Boolean(mergedPrefs?.wants_verified)

  const fetchProfile = useCallback(async () => {
    // Early exit and clear all badge/data if wants_verified is false
    if (!shouldFetchProfile) {
      setBadgeRank({did, badge: null})
      setData(null)
      setDetails(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const safeHandle = String(handle).split(':')[0]
      const profileUrl = `${baseUrl}/get_profile?id=${safeHandle}&service=${TRUANON_SERVICE}`
      const res = await fetch(profileUrl, {headers: TRUANON_AUTH_HEADER})
      const text = await res.text()

      console.log('[TruAnon] Fetched get_profile URL:', profileUrl)

      let json
      try {
        json = JSON.parse(text)
      } catch (err) {
        throw new Error('Invalid JSON: ' + text.slice(0, 100))
      }

      if (!shouldFetchProfile) {
        setBadgeRank({did, badge: null})
      } else {
        const rank = json.authorRank
        const style = getTruAnonBadgeStyle(rank, json.dataConfigurations)
        setBadgeRank({
          did,
          badge: {
            rank,
            style,
          },
        })
      }

      if (!res.ok) {
        console.log('[TruAnon] API Error:', json)
        await updateTruanonPrefs({
          did: did,
          prefs: {wants_verified: 0},
        })

        if (json.type === 'not_found' || json.authorRank === undefined) {
          setData(null)
          setDetails(null)
          setError(null)
          return
        }

        setData(null)
        setDetails(null)
        setError(json.error || json.title || 'Unknown error')
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
      setError(null)
    } catch (err: any) {
      console.warn('[TruAnon] Fetch failed:', err.message)
      setError(err.message)
      setData(null)
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }, [handle, shouldFetchProfile, did, updateTruanonPrefs, setBadgeRank])

  useEffect(() => {
    if (handle) {
      fetchProfile()
    }
  }, [handle, shouldFetchProfile, fetchProfile])

  return {
    data,
    details,
    prefs: mergedPrefs,
    error,
    loading,
    refetch: fetchProfile,
  }
}

export async function getVerifyLink(handle: string): Promise<{
  verifyUrl?: string
  assignedUrl?: string
  truAnonDetails?: any
}> {
  if (!handle) return {}

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
    console.error('[TruAnon] Error verification info:', err)
  }

  return {}
}
