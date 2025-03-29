import {useEffect, useRef} from 'react'
import {useSafeAreaFrame} from 'react-native-safe-area-context'

export function useFullHeight() {
  const {height} = useSafeAreaFrame()
  const fullHeight = useRef(height)
  useEffect(() => {
    if (height > fullHeight.current) {
      fullHeight.current = height
    }
  }, [height, fullHeight])
  return fullHeight.current
}
