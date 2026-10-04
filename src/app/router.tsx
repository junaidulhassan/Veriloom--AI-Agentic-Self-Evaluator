import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { PublicOnly, RequireAuth } from '@/features/auth/AuthGate'
import { RootLayout } from './layouts/RootLayout'
import { RouteError } from './RouteError'
import { ChatPageSkeleton, DashboardPageSkeleton } from './PageSkeletons'

export const loadChatPage = () => import('@/features/chat/ChatPage')
export const loadDashboardPage = () => import('@/features/dashboard/DashboardPage')

const ChatPage = lazy(loadChatPage)
const DashboardPage = lazy(loadDashboardPage)
const AccountPage = lazy(() => import('@/features/account/AccountPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'))
const NotFound = lazy(() => import('./NotFound'))

const suspend = (node: ReactNode, fallback: ReactNode) => <Suspense fallback={fallback}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    path: '/veriloom/login',
    element: <PublicOnly>{suspend(<LoginPage />, null)}</PublicOnly>,
    errorElement: <RouteError />,
  },
  {
    path: '/veriloom/register',
    element: <PublicOnly>{suspend(<RegisterPage />, null)}</PublicOnly>,
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RootLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/veriloom/chat/ai-assistant" replace /> },
      { path: 'veriloom', element: <Navigate to="/veriloom/chat/ai-assistant" replace /> },
      { path: 'veriloom/chat', element: <Navigate to="/veriloom/chat/ai-assistant" replace /> },
      {
        path: 'veriloom/chat/ai-assistant',
        element: suspend(<ChatPage />, <ChatPageSkeleton />),
        errorElement: <RouteError />,
      },
      { path: 'veriloom/agent_eval', element: <Navigate to="/veriloom/agent_eval/dashboard" replace /> },
      {
        path: 'veriloom/agent_eval/dashboard',
        element: suspend(<DashboardPage />, <DashboardPageSkeleton />),
        errorElement: <RouteError />,
      },
      {
        path: 'veriloom/account',
        element: suspend(<AccountPage />, null),
        errorElement: <RouteError />,
      },
      { path: '*', element: suspend(<NotFound />, null) },
    ],
  },
])
