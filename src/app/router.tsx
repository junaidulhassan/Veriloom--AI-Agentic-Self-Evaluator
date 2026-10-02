import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { RootLayout } from './layouts/RootLayout'
import { RouteError } from './RouteError'
import { ChatPageSkeleton, DashboardPageSkeleton } from './PageSkeletons'

export const loadChatPage = () => import('@/features/chat/ChatPage')
export const loadDashboardPage = () => import('@/features/dashboard/DashboardPage')

const ChatPage = lazy(loadChatPage)
const DashboardPage = lazy(loadDashboardPage)
const NotFound = lazy(() => import('./NotFound'))

const suspend = (node: ReactNode, fallback: ReactNode) => <Suspense fallback={fallback}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
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
      { path: '*', element: suspend(<NotFound />, null) },
    ],
  },
])
