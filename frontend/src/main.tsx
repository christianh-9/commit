import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { Layout, RequireAuth } from '@/components/layout'
import { Toaster } from '@/components/ui/sonner'
import History from '@/pages/history'
import Home from '@/pages/home'
import Log from '@/pages/log'
import { AuthCallback, Login, Register } from '@/pages/auth'
import Settings from '@/pages/settings'
import './index.css'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // 401s already redirect to /login.
    onError: (err) => !(err instanceof ApiError && err.status === 401) && toast.error(err.message),
  }),
  defaultOptions: { queries: { retry: (n, err) => !(err instanceof ApiError) && n < 2 } },
})

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  {
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <Home /> },
      { path: '/log', element: <Log /> },
      { path: '/history', element: <History /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
