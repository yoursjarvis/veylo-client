"use client"
import { CheckCheck, Eye, EyeOff, X } from "lucide-react"
import { useMemo, useState } from "react"

// Constants
const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: "At least 8 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[!-/:-@[-`{-~]/, text: "At least 1 special characters" },
] as const

type StrengthScore = 0 | 1 | 2 | 3 | 4 | 5

const STRENGTH_CONFIG = {
  colors: {
    0: "bg-border",
    1: "bg-destructive",
    2: "bg-warning",
    3: "bg-warning",
    4: "bg-warning",
    5: "bg-success",
  } satisfies Record<StrengthScore, string>,
  texts: {
    0: "Enter a password",
    1: "Weak password",
    2: "Medium password!",
    3: "Strong password!!",
    4: "Very Strong password!!!",
  } satisfies Record<Exclude<StrengthScore, 5>, string>,
} as const

// Types
type Requirement = {
  met: boolean
  text: string
}

type PasswordStrength = {
  score: StrengthScore
  requirements: Requirement[]
}

const PasswordInput = () => {
  const [password, setPassword] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  const calculateStrength = useMemo((): PasswordStrength => {
    const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
      met: req.regex.test(password),
      text: req.text,
    }))

    return {
      score: requirements.filter((req) => req.met).length as StrengthScore,
      requirements,
    }
  }, [password])

  // console.log(calculateStrength);

  return (
    <div className="mx-auto w-96 py-14">
      <form className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={isVisible ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-invalid={calculateStrength.score < 4}
            aria-describedby="password-strength"
            className="w-full rounded-md border-2 bg-background p-2 outline-hidden transition focus-within:border-primary dark:bg-background"
          />
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground/80 outline-hidden hover:text-foreground"
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </form>
      <div className="mt-2 flex w-full justify-between gap-2">
        <span
          className={`${
            calculateStrength.score >= 1
              ? "bg-success/20"
              : "bg-background"
          } w-full rounded-full p-1`}
        ></span>
        <span
          className={`${
            calculateStrength.score >= 2
              ? "bg-success/30"
              : "bg-background"
          } w-full rounded-full p-1`}
        ></span>
        <span
          className={`${
            calculateStrength.score >= 3
              ? "bg-success/40"
              : "bg-background"
          } w-full rounded-full p-1`}
        ></span>
        <span
          className={`${
            calculateStrength.score >= 4
              ? "bg-success/50"
              : "bg-background"
          } w-full rounded-full p-1`}
        ></span>
        <span
          className={`${
            calculateStrength.score >= 5
              ? "bg-success"
              : "bg-background"
          } w-full rounded-full p-1`}
        ></span>
      </div>

      <p
        id="password-strength"
        className="my-2 flex justify-between text-sm font-medium"
      >
        <span>Must contain:</span>
        <span>
          {
            STRENGTH_CONFIG.texts[
              Math.min(
                calculateStrength.score,
                4
              ) as keyof typeof STRENGTH_CONFIG.texts
            ]
          }
        </span>
      </p>

      <ul className="space-y-1.5" aria-label="Password requirements">
        {calculateStrength.requirements.map((req) => (
          <li key={req.text} className="flex items-center space-x-2">
            {req.met ? (
              <CheckCheck size={16} className="text-emerald-500" />
            ) : (
              <X size={16} className="text-muted-foreground/80" />
            )}
            <span
              className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}
            >
              {req.text}
              <span className="sr-only">
                {req.met ? " - Requirement met" : " - Requirement not met"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PasswordInput
