import { useHashRoute } from './lib/router'
import Landing from './pages/Landing'
import Write from './pages/Write'
import Home from './pages/Home'
import Read from './pages/Read'
import Replies from './pages/Replies'
import Photos from './pages/Photos'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  const path = useHashRoute()

  let page: React.ReactNode
  if (path === '/' || path === '') page = <Landing />
  else if (path === '/write') page = <Write />
  else if (path === '/replies') page = <Replies />
  else if (path === '/photos') page = <Photos />
  else if (path === '/admin') page = <Admin />
  else {
    const homeMatch = path.match(/^\/home\/([^/]+)\/?$/)
    if (homeMatch) {
      page = <Home recipientId={decodeURIComponent(homeMatch[1])} />
    } else {
      const readMatch = path.match(/^\/read\/([^/]+)\/?$/)
      if (readMatch) page = <Read recipientId={decodeURIComponent(readMatch[1])} />
      else page = <NotFound />
    }
  }

  return <div className="min-h-dvh bg-app-gradient">{page}</div>
}
