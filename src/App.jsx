import { TournamentProvider } from './context/TournamentContext'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Groups } from './pages/Groups'
import { Fixtures } from './pages/Fixtures'
import { Standings } from './pages/Standings'
import { Bracket } from './pages/Bracket'
import { Admin } from './pages/Admin'

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
            <Route path="/bracket" element={<Bracket />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TournamentProvider>
  )
}

export default App
