"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Company {
	id: string;
	name: string;
	blurb: string;
	looking_for: string;
	logo_slug: string;
	tier: string;
	stage: string;
	scheduling_url: string;
}

interface CompanyCardProps {
	company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
	const [stage, setStage] = React.useState(company.stage);
	const [isUpdating, setIsUpdating] = React.useState(false);
	const [showDetails, setShowDetails] = React.useState(stage !== "pending");

	const updateStage = async (newStage: string) => {
		setIsUpdating(true);
		try {
			// Get the token from the URL
			const token = window.location.pathname.split("/")[2];

			const response = await fetch("/api/update-match-stage", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token,
					companyId: company.id,
					stage: newStage,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update stage");
			}

			const result = await response.json();

			// Update local state only after successful API call
			setStage(newStage);
			if (newStage === "accepted") {
				setShowDetails(true);
			} else if (newStage === "rejected") {
				setShowDetails(false);
			} else if (newStage === "pending") {
				setShowDetails(false); // Reset to preview if undoing
			} else {
				// For other stages (scheduled, completed, etc.), keep details shown
				setShowDetails(true);
			}
		} catch (error) {
			console.error("Error updating stage:", error);
			// You could add a toast notification here to show the error to the user
		} finally {
			setIsUpdating(false);
		}
	};

	const handlePreviewAccept = () => {
		updateStage("accepted");
	};

	const handlePreviewReject = () => {
		updateStage("rejected");
	};

	const isRejected = stage === "rejected";
	const isAccepted = stage === "accepted";
	const isPending = stage === "pending";

	// Preview mode - show minimal info with check/X buttons
	if (isPending && !showDetails) {
		return (
			<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6">
				{/* Logo */}
				<div className="flex items-center justify-center mb-4">
					<div className="w-16 h-16 relative">
						<Image
							src={`/logos/${company.logo_slug}.png`}
							alt={`${company.name} logo`}
							fill
							className="object-contain"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.src = "/placeholder-logo.svg";
							}}
						/>
					</div>
				</div>

				{/* Company Name */}
				<h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
					{company.name}
				</h3>

				{/* Top 10 Badge */}
				{company.tier === "Top 10" && (
					<div className="flex justify-center mb-4">
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
							Top 10
						</span>
					</div>
				)}

				{/* Preview Action Buttons */}
				<div className="flex gap-3 justify-center">
					<button
						onClick={handlePreviewAccept}
						disabled={isUpdating}
						className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
						title="Accept"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</button>
					<button
						onClick={handlePreviewReject}
						disabled={isUpdating}
						className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
						title="Reject"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>
		);
	}

	// Full details mode
	return (
		<div
			className={`rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-6 relative ${
				isRejected ? "bg-gray-100 opacity-60" : "bg-white"
			}`}
		>
			{/* Undo Button - Top Right Corner */}
			{!isPending && (
				<button
					onClick={() => updateStage("pending")}
					disabled={isUpdating}
					className="absolute top-2 right-2 w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50 text-sm"
					title="Undo"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
						/>
					</svg>
				</button>
			)}
			{/* Logo */}
			<div className="flex items-center justify-center mb-4">
				<div className="w-16 h-16 relative">
					<Image
						src={`/logos/${company.logo_slug}.png`}
						alt={`${company.name} logo`}
						fill
						className={`object-contain ${isRejected ? "grayscale" : ""}`}
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/placeholder-logo.svg";
						}}
					/>
				</div>
			</div>

			{/* Company Name */}
			<h3
				className={`text-xl font-semibold mb-2 ${
					isRejected ? "text-gray-500 line-through" : "text-gray-900"
				}`}
			>
				{company.name}
			</h3>

			{/* Badges */}
			<div className="flex flex-wrap gap-2 mb-3">
				{company.tier === "Top 10" && (
					<span
						className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
							isRejected
								? "bg-gray-200 text-gray-500"
								: "bg-yellow-100 text-yellow-800"
						}`}
					>
						Top 10
					</span>
				)}
				{stage === "accepted" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
						Accepted
					</span>
				)}
				{stage === "rejected" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
						Rejected
					</span>
				)}
				{stage === "scheduled" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
						Scheduled
					</span>
				)}
				{stage === "completed" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
						Completed
					</span>
				)}
				{stage === "declined" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
						Declined
					</span>
				)}
				{stage === "canceled" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
						Canceled
					</span>
				)}
				{stage === "no_show" && (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
						No Show
					</span>
				)}
			</div>

			{/* Blurb */}
			<p
				className={`text-sm mb-3 line-clamp-3 ${
					isRejected ? "text-gray-400" : "text-gray-600"
				}`}
			>
				{company.blurb}
			</p>

			{/* Looking For */}
			<div className="mb-4">
				<h4
					className={`text-sm font-medium mb-1 ${
						isRejected ? "text-gray-400" : "text-gray-900"
					}`}
				>
					Looking for:
				</h4>
				<p
					className={`text-sm ${
						isRejected ? "text-gray-400" : "text-gray-600"
					}`}
				>
					{company.looking_for}
				</p>
			</div>

			{/* Stage Dropdown */}
			{!isPending && (
				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Current Stage:
					</label>
					<select
						value={stage}
						onChange={(e) => updateStage(e.target.value)}
						disabled={isUpdating}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<option value="scheduled">Scheduled</option>
						<option value="completed">Completed</option>
						<option value="declined">Declined</option>
						<option value="canceled">Canceled</option>
						<option value="no_show">No Show</option>
					</select>
				</div>
			)}

			{/* Action Buttons */}
			<div className="space-y-2">
				{isAccepted && (
					<Link
						href={company.scheduling_url}
						target="_blank"
						rel="noopener noreferrer"
						className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-center block"
					>
						Schedule Meeting
					</Link>
				)}
			</div>
		</div>
	);
}
