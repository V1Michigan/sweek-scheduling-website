export default function NotFound() {
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center">
				<div className="mb-4">
					<h1 className="text-6xl font-bold text-gray-300">404</h1>
				</div>
				<h2 className="text-2xl font-semibold text-gray-900 mb-2">
					Invalid or Expired Token
				</h2>
				<p className="text-gray-600 mb-6">
					The token you provided is either invalid, expired, or the student
					account is inactive.
				</p>
				<div className="space-y-2 text-sm text-gray-500">
					<p>Please check your link and try again.</p>
					<p>If you continue to have issues, please contact support.</p>
				</div>
			</div>
		</div>
	);
}
