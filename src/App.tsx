import { Box, Flex, Heading } from "@radix-ui/themes"
import "./App.css"
import { useAppSelector } from "./app/hooks"
import Period from "./features/finance-periods/period/Period"
import { selectAllPeriods } from "./features/finance-periods/period/periodsSlice"
import { getDaysBetweenTwoDates } from "./utils"
import { createContext, useEffect, useState } from "react"
import { supabase } from "./backend/supabaseClient"
import { type Session } from "@supabase/supabase-js"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import useSupabaseSession from "./hooks/useSupabaseSession"

const UserContext = createContext<string | null>(null)

const App = () => {
  const [session, isLoading] = useSupabaseSession()
  const financePeriods = useAppSelector(selectAllPeriods)

  if (isLoading) return <p>Loading...</p>

  if (!session) {
    return (
      <div className="App">
        <Box width="300px">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </Box>
      </div>
    )
  } else {
    const periods = financePeriods.map((period, i, arr) => {
      const daysToNewPeriod = getDaysBetweenTwoDates(
        period.start_date,
        arr[i + 1]?.start_date,
      )
      return (
        <Period
          key={period.id}
          id={period.id}
          index={i}
          daysToNewPeriod={daysToNewPeriod}
        />
      )
    })

    return (
      <div className="App">
        <UserContext.Provider value={session.user.id}>
          <Flex direction="column" align="start" width="100%">
            <Heading as="h1" size="7" mt="4">
              Finance tracker
            </Heading>
            {periods}
          </Flex>
        </UserContext.Provider>
      </div>
    )
  }
}

export default App
