import { AuthProvider } from './context/AuthContext'
import { TournamentProvider } from './context/TournamentContext'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DatasetSwitcher } from './components/DatasetSwitcher'
import { Home } from './pages/Home'
import { Groups } from './pages/Groups'
import { Fixtures } from './pages/Fixtures'
import { Standings } from './pages/Standings'
import { Settings } from './pages/Settings'

function App() {
  return (
    <AuthProvider>
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
          <DatasetSwitcher />
        </BrowserRouter>
      </TournamentProvider>
    </AuthProvider>
  )
}

export default App
