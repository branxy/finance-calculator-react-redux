import { useState, type FunctionComponent } from "react"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import {
  periodAdded,
  selectPeriodById,
  startBalanceChanged,
  startDateChanged,
} from "./periodsSlice"
import Dropdown from "../../../components/Dropdown"
import Forecast, {
  type FixedPaymentsT,
  type EarningsT,
  type VariablePaymentsT,
  type AllPayments,
} from "../cashflow/Forecast"
import {
  selectAllPaymentsByPeriodId,
  selectEarningsByPeriodId,
  selectFixedPaymentsByPeriodId,
  selectVariablePaymentsByPeriodId,
} from "../cashflow/cashflowSlice"

import DaysToNewPeriod from "./DaysToNewPeriod"
import AllTransactions from "../cashflow/AllTransactions"
import type { FinancePeriod } from "../types"
import {
  Box,
  Button,
  Flex,
  Heading,
  Separator,
  TextField,
} from "@radix-ui/themes"
import PeriodHeader from "./PeriodHeader"

interface PeriodProps {
  id: FinancePeriod["id"]
  index: number
  daysToNewPeriod: number | undefined
}

const Period: FunctionComponent<PeriodProps> = props => {
  const { id, index, daysToNewPeriod } = props
  const {
    user_id,
    start_date,
    start_balance,
    end_balance,
    stock,
    forward_payments,
  } = useAppSelector(state => selectPeriodById(state, id))
  const dispatch = useAppDispatch()

  const earnings = useAppSelector(state =>
    selectEarningsByPeriodId(state, id),
  ) as EarningsT
  const allPayments = useAppSelector(state =>
    selectAllPaymentsByPeriodId(state, id),
  ) as AllPayments

  const fixedPayments = useAppSelector(state =>
    selectFixedPaymentsByPeriodId(state, id),
  ) as FixedPaymentsT
  const variablePayments = useAppSelector(state =>
    selectVariablePaymentsByPeriodId(state, id),
  ) as VariablePaymentsT

  const fixedPaymentsSum = fixedPayments.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  const variablePaymentsSum = variablePayments.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  function handleAddFinancePeriod() {
    dispatch(periodAdded({ prevPeriodId: id, user_id }))
  }

  function handleStartBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (typeof Number(e.target.value) === "number") {
      const newValue = Number(e.target.value)
      dispatch(
        startBalanceChanged({
          periodId: id,
          newStartBalance: newValue,
        }),
      )
    }
  }

  return (
    <>
      {index > 0 && <Separator size="4" mt="4" />}
      <Flex direction="column" gap="2" mt="6" width="100%">
        <PeriodHeader id={id} start_date={start_date} />
        <Flex align="center" gap="2">
          <label htmlFor="start-balance">Стартовый баланс: </label>
          {index === 0 ? (
            <Box maxWidth="250px">
              <TextField.Root
                type="number"
                name="start-balance"
                id="start-balance"
                value={start_balance || ""}
                min="1"
                onFocus={e => e.target.select()}
                onChange={handleStartBalanceChange}
                placeholder="0 руб."
              />
            </Box>
          ) : (
            <span>{start_balance} руб.</span>
          )}
        </Flex>
        <DaysToNewPeriod
          periodIndex={index}
          daysToNewPeriod={daysToNewPeriod}
        />
        <Dropdown title="Оборот" isOpenByDefault={true}>
          <AllTransactions
            periodId={id}
            periodIndex={index}
            earnings={earnings}
            end_balance={end_balance}
            allPayments={allPayments}
            fixedPaymentsSum={fixedPaymentsSum}
            variablePaymentsSum={variablePaymentsSum}
            fixedPaymentsLength={fixedPayments.length}
            variablePaymentsLength={variablePayments.length}
          />
        </Dropdown>
        <Forecast
          periodId={id}
          start_balance={start_balance}
          end_balance={end_balance}
          earnings={earnings}
          stock={stock}
          forwardPayments={forward_payments}
          fixedPayments={fixedPaymentsSum}
          variablePayments={variablePaymentsSum}
        />
        <div className="div">
          <Button size="3" onClick={handleAddFinancePeriod}>
            <span className="material-symbols-outlined">add</span>
            <span>Добавить период</span>
          </Button>
        </div>
      </Flex>
    </>
  )
}

export default Period
