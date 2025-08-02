"use client"

import * as React from "react"

import type { ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type State = {
  toasts: ToasterToast[]
}

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects !
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: ((state: State) => void)[] = []

const callListeners = (state: State) => {
  listeners.forEach((listener) => {
    listener(state)
  })
}

const toaster = (() => {
  let memoryState: State = { toasts: [] }

  function dispatch(action: Action) {
    memoryState = reducer(memoryState, action)
    callListeners(memoryState)
  }

  const actions = {
    /**
     * Show a toast
     */
    toast: ({ ...props }: ToastProps) => {
      const id = genId()

      const update = (props: ToasterToast) =>
        dispatch({
          type: actionTypes.UPDATE_TOAST,
          toast: { ...props, id },
        })
      const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

      dispatch({
        type: actionTypes.ADD_TOAST,
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) dismiss()
          },
        },
      })

      return {
        id: id,
        update,
        dismiss,
      }
    },

    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    remove: (toastId?: string) => dispatch({ type: actionTypes.REMOVE_TOAST, toastId }),
  }

  return {
    ...actions,
    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener)
      return () => {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    },
    getState: () => memoryState,
  }
})()

const REMOVE_QUEUE: { [id: string]: NodeJS.Timeout } = {}

const addToRemoveQueue = (toastId: string) => {
  if (REMOVE_QUEUE[toastId]) {
    clearTimeout(REMOVE_QUEUE[toastId])
  }
  REMOVE_QUEUE[toastId] = setTimeout(() => {
    delete REMOVE_QUEUE[toastId]
    toaster.remove(toastId)
  }, TOAST_REMOVE_DELAY)
}

export function useToast() {
  const [state, setState] = React.useState(toaster.getState())

  React.useEffect(() => {
    return toaster.subscribe(setState)
  }, [])

  return {
    ...state,
    ...toaster,
  }
}
