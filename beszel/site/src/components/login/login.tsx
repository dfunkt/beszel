import { t } from "@lingui/core/macro";
import { UserAuthForm } from "@/components/login/auth-form"
import { Logo } from "../logo"
import { useEffect, useMemo, useState } from "react"
import { pb } from "@/lib/stores"
import { useStore } from "@nanostores/react"
import ForgotPassword from "./forgot-pass-form"
import { $router } from "../router"
import { AuthMethodsList } from "pocketbase"
import { useTheme } from "../theme-provider"

export default function () {
	const page = useStore($router)
	const [isFirstRun, setFirstRun] = useState(false)
	const [authMethods, setAuthMethods] = useState<AuthMethodsList>()
	const { theme } = useTheme()

	useEffect(() => {
		document.title = t`Login` + " / Beszel"
		pb.send("/api/beszel/first-run", {}).then(({ firstRun }) => {
			setFirstRun(firstRun)
		})
	}, [])

	useEffect(() => {
		pb.collection("users")
			.listAuthMethods()
			.then((methods) => {
				setAuthMethods(methods)
			})
	}, [])

	// OAuth Auto Redirect Logic
	useEffect(() => {
		if (!authMethods || isFirstRun || page?.route === "forgot_password") {
			return
		}

		// Check if conditions are met for auto redirect
		const passwordDisabled = !authMethods.usernamePassword
		const oauthProviders = authMethods.authProviders || []
		
		// Only auto-redirect if password auth is disabled AND exactly one OAuth provider
		if (passwordDisabled && oauthProviders.length === 1) {
			const provider = oauthProviders[0]
			// Small delay for better UX
			setTimeout(() => {
				window.location.href = provider.authUrl + pb.baseUrl + '/api/oauth2-redirect'
			}, 500)
		}
	}, [authMethods, isFirstRun, page])

	const subtitle = useMemo(() => {
		if (isFirstRun) {
			return t`Please create an admin account`
		} else if (page?.route === "forgot_password") {
			return t`Enter email address to reset password`
		} else {
			return t`Please sign in to your account`
		}
	}, [isFirstRun, page])

	if (!authMethods) {
		return null
	}

	return (
		<div className="min-h-svh grid items-center py-12">
			<div
				className="grid gap-5 w-full px-4 mx-auto"
				// @ts-ignore
				style={{ maxWidth: "22em", "--border": theme == "light" ? "30 8% 80%" : "220 3% 20%" }}
			>
				<div className="text-center">
					<h1 className="mb-3">
						<Logo className="h-7 fill-foreground mx-auto" />
						<span className="sr-only">Beszel</span>
					</h1>
					<p className="text-sm text-muted-foreground">{subtitle}</p>
				</div>
				{page?.route === "forgot_password" ? (
					<ForgotPassword />
				) : (
					<UserAuthForm isFirstRun={isFirstRun} authMethods={authMethods} />
				)}
			</div>
		</div>
	)
}
