import { useQuery } from '@tanstack/react-query'
import { api, call } from './client'

export const keys = {
  me: ['me'],
  streak: ['stats', 'streak'],
  heatmap: ['stats', 'heatmap'],
  exercises: ['exercises'],
  workouts: ['workouts'],
} as const

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => call(api.GET('/users/me')) })
export const useStreak = () => useQuery({ queryKey: keys.streak, queryFn: () => call(api.GET('/stats/streak')) })
export const useHeatmap = () => useQuery({ queryKey: keys.heatmap, queryFn: () => call(api.GET('/stats/heatmap')) })
export const useExercises = () =>
  useQuery({ queryKey: keys.exercises, queryFn: () => call(api.GET('/exercises')), staleTime: Infinity })
export const useWorkouts = () =>
  useQuery({ queryKey: keys.workouts, queryFn: () => call(api.GET('/workouts', { params: { query: { limit: 200 } } })) })
