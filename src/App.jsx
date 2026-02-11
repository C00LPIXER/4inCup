import { TournamentProvider } from './context/TournamentContext'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Groups } from './pages/Groups'
import { Fixtures } from './pages/Fixtures'
import { Standings } from './pages/Standings'
import { Settings } from './pages/Settings'

function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TournamentProvider>
  )
}

export default App
