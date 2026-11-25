import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { nextOffset, todayIn } from '@/lib/logic'
import { api, call } from './client'

export const keys = {
  me: ['me'],
  streak: ['stats', 'streak'],
  heatmap: ['stats', 'heatmap'],
  exercises: ['exercises'],
  workouts: ['workouts'],
} as const

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => call(api.GET('/users/me')) })

// today in the account's timezone, which is what the server checks dates against
export function useToday() {
  const { data } = useMe()
  return todayIn(data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
}
export const useStreak = () => useQuery({ queryKey: keys.streak, queryFn: () => call(api.GET('/stats/streak')) })
export const useHeatmap = () => useQuery({ queryKey: keys.heatmap, queryFn: () => call(api.GET('/stats/heatmap')) })
export const useExercises = () =>
  useQuery({ queryKey: keys.exercises, queryFn: () => call(api.GET('/exercises')), staleTime: Infinity })
const PAGE_SIZE = 30

// newest first, 30 at a time
export const useWorkouts = () =>
  useInfiniteQuery({
    queryKey: keys.workouts,
    queryFn: ({ pageParam }) =>
      call(api.GET('/workouts', { params: { query: { limit: PAGE_SIZE, offset: pageParam } } })),
    initialPageParam: 0,
    getNextPageParam: (_last, pages) => nextOffset(pages, PAGE_SIZE),
  })
export const useWorkout = (id: string) =>
  useQuery({
    queryKey: [...keys.workouts, id],
    queryFn: () => call(api.GET('/workouts/{workout_id}', { params: { path: { workout_id: id } } })),
  })
