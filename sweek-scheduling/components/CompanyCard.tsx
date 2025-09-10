"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Undo2, Calendar, Star, ExternalLink } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface Company {
	id: string;
	name: string;
	blurb: string;
	looking_for: string;
	logo_slug: string;
	tier: string;
	stage: string;
	scheduling_url: string;
	website_url?: string;
}

interface CompanyCardProps {
	company: Company;
	onStageUpdate?: (companyId: string, newStage: string) => void;
}

export default function CompanyCard({
	company,
	onStageUpdate,
}: CompanyCardProps) {
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

			// Call the parent callback to trigger re-sort animation
			if (onStageUpdate) {
				onStageUpdate(company.id, newStage);
			}
		} catch (error) {
			console.error("Error updating stage:", error);
			// You could add a toast notification here to show the error to the user
		} finally {
			setIsUpdating(false);
		}
	};

	const handlePreviewAccept = () => {
		updateStage("need_to_schedule");
	};

	const handlePreviewReject = () => {
		updateStage("rejected");
	};

	const isRejected = stage === "rejected";
	const isAccepted =
		stage === "need_to_schedule" ||
		stage === "scheduled" ||
		stage === "completed";
	const isPending = stage === "pending";

	// Preview mode - show minimal info with check/X buttons
	// Also show declined cards as small preview cards
	if ((isPending && !showDetails) || isRejected) {
		return (
			<motion.div
				layout
				animate={{
					opacity: isRejected ? 0.6 : 1,
					scale: isRejected ? 0.95 : 1,
				}}
				transition={{
					layout: { type: "spring", stiffness: 400, damping: 40 },
					opacity: { duration: 0.3 },
					scale: { duration: 0.3 },
				}}
				className={`group relative rounded-lg border overflow-hidden ${
					isRejected
						? "bg-gray-50 border-gray-300 grayscale min-h-[200px] hover:opacity-80"
						: "bg-white border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 min-h-[280px]"
				}`}
			>
				{/* Undo Button - Top Right Corner for declined cards */}
				{isRejected && (
					<button
						onClick={() => updateStage("pending")}
						disabled={isUpdating}
						className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 z-20 shadow-sm"
						title="Reset to preview"
					>
						<Undo2 className="w-4 h-4 text-gray-500" />
					</button>
				)}
				{/* Card Content */}
				<div
					className={`p-6 flex flex-col h-full ${
						isRejected ? "min-h-[152px]" : "min-h-[232px]"
					}`}
				>
					{/* Logo */}
					<div className="flex justify-center mb-4">
						<div
							className={`relative bg-gray-50 rounded-xl p-3 group-hover:bg-gray-100 transition-colors ${
								isRejected ? "w-12 h-12" : "w-16 h-16"
							}`}
						>
							<img
								src={`/logos/${company.logo_slug}.png`}
								alt={`${company.name} logo`}
								className="w-full h-full object-contain"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.src = "/placeholder-logo.svg";
								}}
							/>
						</div>
					</div>

					{/* Company Name */}
					{company.website_url ? (
						<Link
							href={company.website_url}
							target="_blank"
							rel="noopener noreferrer"
							className={`font-instrument font-medium text-center leading-tight block hover:underline transition-colors ${
								isRejected
									? "text-base text-gray-400 line-through mb-2 hover:text-gray-500"
									: "text-xl text-[#444444] mb-4 hover:text-[#333]"
							}`}
						>
							<div className="flex items-center justify-center gap-2">
								<span>{company.name}</span>
								<ExternalLink
									size={16}
									className={`${
										isRejected ? "text-gray-400" : "text-[#666]"
									} group-hover:text-[#333] transition-colors`}
								/>
							</div>
						</Link>
					) : (
						<h3
							className={`font-instrument font-medium text-center leading-tight ${
								isRejected
									? "text-base text-gray-400 line-through mb-2"
									: "text-xl text-[#444444] mb-4"
							}`}
						>
							{company.name}
						</h3>
					)}

					{/* Instructions or Declined Status */}
					{isRejected ? (
						<div className="text-center mt-auto">
							<p className="text-xs font-inter text-gray-400">Declined</p>
						</div>
					) : (
						<>
							<p className="text-xs font-inter text-[#444444]/60 text-center mb-6 leading-relaxed">
								Please accept or decline
								<br />
								(You can always undo later if you change your mind)
							</p>

							{/* Action Buttons */}
							<div className="mt-auto flex gap-3">
								<button
									onClick={handlePreviewAccept}
									disabled={isUpdating}
									className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-[#191919] font-inter font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
								>
									<Check className="w-4 h-4" />
									Accept
								</button>
								<button
									onClick={handlePreviewReject}
									disabled={isUpdating}
									className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#444444] font-inter font-medium py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
								>
									<X className="w-4 h-4" />
									Pass
								</button>
							</div>
						</>
					)}
				</div>
			</motion.div>
		);
	}

	// Full details mode
	return (
		<motion.div
			layout
			animate={{
				opacity: isRejected ? 0.6 : 1,
				scale: 1,
			}}
			transition={{
				layout: { type: "spring", stiffness: 400, damping: 40 },
				opacity: { duration: 0.3 },
			}}
			className={`group relative bg-white rounded-lg border border-gray-200 overflow-visible hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 min-h-[420px] ${
				isRejected ? "grayscale" : ""
			}`}
		>
			{/* Undo Button - Top Right Corner */}
			{!isPending && (
				<button
					onClick={() => updateStage("pending")}
					disabled={isUpdating}
					className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 z-20 shadow-sm"
					title="Reset to preview"
				>
					<Undo2 className="w-4 h-4 text-gray-500" />
				</button>
			)}

			{/* Card Content */}
			<div className="p-6 flex flex-col h-full min-h-[372px]">
				{/* Logo */}
				<div className="flex justify-center mb-4">
					<div className="relative w-16 h-16 bg-gray-50 rounded-xl p-3 group-hover:bg-gray-100 transition-colors">
						<img
							src={`/logos/${company.logo_slug}.png`}
							alt={`${company.name} logo`}
							className="w-full h-full object-contain"
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.src = "/placeholder-logo.svg";
							}}
						/>
					</div>
				</div>

				{/* Company Name */}
				{company.website_url ? (
					<Link
						href={company.website_url}
						target="_blank"
						rel="noopener noreferrer"
						className={`text-xl font-instrument font-medium text-center mb-4 leading-tight block hover:underline transition-colors ${
							isRejected
								? "line-through text-gray-400 hover:text-gray-500"
								: "text-[#444444] hover:text-[#333]"
						}`}
					>
						<div className="flex items-center justify-center gap-2">
							<span>{company.name}</span>
							<ExternalLink
								size={16}
								className={`${
									isRejected ? "text-gray-400" : "text-[#666]"
								} group-hover:text-[#333] transition-colors`}
							/>
						</div>
					</Link>
				) : (
					<h3
						className={`text-xl font-instrument font-medium text-center mb-4 leading-tight ${
							isRejected ? "line-through text-gray-400" : "text-[#444444]"
						}`}
					>
						{company.name}
					</h3>
				)}

				{/* Company Description */}
				<p
					className={`text-sm font-inter leading-relaxed text-center mb-4 ${
						isRejected ? "text-gray-400" : "text-[#444444]"
					}`}
				>
					{company.blurb}
				</p>

				{/* Looking For */}
				<div className="mb-4">
					<h4
						className={`text-sm font-inter font-semibold mb-2 text-center ${
							isRejected ? "text-gray-400" : "text-[#444444]"
						}`}
					>
						Looking for:
					</h4>
					<p
						className={`text-sm font-inter leading-relaxed text-center ${
							isRejected ? "text-gray-400" : "text-[#444444]"
						}`}
					>
						{company.looking_for}
					</p>
				</div>

				{/* Stage Dropdown */}
				{!isPending && (
					<div className="mb-6 relative z-30">
						<label className="block text-sm font-inter font-medium text-[#444444] mb-2 text-center">
							Update Status:
						</label>
						<Select
							value={stage}
							onValueChange={updateStage}
							disabled={isUpdating}
						>
							<SelectTrigger className="w-full bg-white border-gray-200 focus:border-yellow-400 focus:ring-yellow-400/20 h-10">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent className="z-50 bg-white border border-gray-200 shadow-lg">
								<SelectItem value="need_to_schedule">
									📋 Need to Schedule
								</SelectItem>
								<SelectItem value="scheduled">📅 Scheduled</SelectItem>
								<SelectItem value="completed">✅ Completed</SelectItem>
								<SelectItem value="canceled">🚫 Canceled</SelectItem>
								<SelectItem value="no_show">⏰ No Show</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Action Button & Additional Info */}
				<div className="mt-auto space-y-3">
					{(stage === "need_to_schedule" ||
						stage === "scheduled" ||
						stage === "completed") && (
						<>
							{/* Scheduling Information */}
							<div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
								<p className="text-sm font-inter text-green-700 font-medium mb-1">
									🎉 Great choice!
								</p>
								<p className="text-xs font-inter text-green-600">
									Click below to schedule your chat with {company.name}
								</p>
							</div>

							{/* Schedule Button */}
							<Link
								href={company.scheduling_url}
								target="_blank"
								rel="noopener noreferrer"
								className="group w-full bg-yellow-400 hover:bg-yellow-300 text-[#191919] font-inter font-bold py-3 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
							>
								<Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
								Schedule Meeting
								<svg
									className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 transition-transform"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>
							</Link>
						</>
					)}
				</div>
			</div>
		</motion.div>
	);
}
