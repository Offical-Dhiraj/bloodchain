'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCreateBloodRequest } from '@/hooks/useBloodRequests'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, MapPin, Loader2, ArrowRight, HeartPulse } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

// Validation Schema
const requestSchema = z.object({
    bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']),
    rhFactor: z.enum(['POSITIVE', 'NEGATIVE']),
    units: z.number().min(1).max(10),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY']),
    latitude: z.number({ error: () => ({ message: "Location is required" }) }),
    longitude: z.number({ error: () => ({ message: "Location is required" }) }),
    radius: z.number().default(50),
})

type FormData = z.infer<typeof requestSchema>

const steps = [
    { id: 1, title: 'Urgency' },
    { id: 2, title: 'Blood Requirements' },
    { id: 3, title: 'Location' },
]

export default function NewRequestPage() {
    const [currentStep, setCurrentStep] = useState(1)
    const [isLocating, setIsLocating] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false) // Track success state

    const router = useRouter()
    const queryClient = useQueryClient() // Initialize Query Client
    const createRequest = useCreateBloodRequest()

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            urgency: 'MEDIUM',
            units: 1,
            rhFactor: 'POSITIVE',
            radius: 50
        }
    })

    // Implementation of Browser Geolocation API
    const handleGetLocation = () => {
        setIsLocating(true)

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser")
            setIsLocating(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setValue('latitude', position.coords.latitude, { shouldValidate: true })
                setValue('longitude', position.coords.longitude, { shouldValidate: true })
                setIsLocating(false)
            },
            (error) => {
                console.error("Error fetching location:", error)
                let errorMessage = "Could not fetch location."
                if (error.code === 1) errorMessage = "Location permission denied."
                else if (error.code === 2) errorMessage = "Location unavailable."
                else if (error.code === 3) errorMessage = "Location request timed out."

                alert(errorMessage)
                setIsLocating(false)
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        )
    }

    const onSubmit = (data: FormData) => {
        createRequest.mutate(data, {
            onSuccess: async () => {
                // 1. Invalidate caches so the Dashboard fetches new data immediately
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['active-requests'] }),
                    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
                ])

                // 2. Show Success UI instead of immediate redirect
                setIsSuccess(true)
            },
            onError: (err) => {
                console.error("Failed to create request:", err)
                alert("Failed to create request. Please try again.")
            }
        })
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

    // --- SUCCESS VIEW ---
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 text-center"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Broadcasted!</h2>
                    <p className="text-gray-500 mb-8">
                        Your blood request has been successfully created. Our AI engine is now matching you with nearby donors.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg"
                    >
                        Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </motion.div>
            </div>
        )
    }

    // --- FORM VIEW ---
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">

                {/* Progress Header */}
                <div className="bg-slate-900 p-6 text-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <HeartPulse className="text-red-500" /> New Blood Request
                        </h2>
                        <span className="text-slate-400 text-sm">Step {currentStep} of 3</span>
                    </div>

                    <div className="flex items-center gap-2 px-2">
                        {steps.map((step) => (
                            <div key={step.id} className="flex-1 flex flex-col items-center relative">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all duration-300 ${
                                        step.id <= currentStep
                                            ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-110'
                                            : 'bg-slate-700'
                                    }`}>
                                    {step.id < currentStep ? <CheckCircle2 size={16} /> : step.id}
                                </div>
                                <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                                    step.id <= currentStep ? 'text-white' : 'text-slate-500'
                                }`}>
                                    {step.title}
                                </span>
                                {/* Connecting Line */}
                                {step.id !== 3 && (
                                    <div className="absolute top-4 left-1/2 w-full h-[2px] -z-0">
                                        <div className={`h-full transition-all duration-500 ${
                                            step.id < currentStep ? 'bg-red-600' : 'bg-slate-800'
                                        }`} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 flex-1 flex flex-col">
                    <div className="flex-1">
                        <AnimatePresence mode="wait">

                            {/* Step 1: Urgency & Basic Info */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <Label className="text-lg">How urgent is this request?</Label>
                                        <RadioGroup
                                            onValueChange={(val: any) => setValue('urgency', val)}
                                            defaultValue="MEDIUM"
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                        >
                                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY'].map((level) => (
                                                <div key={level}>
                                                    <RadioGroupItem value={level} id={level} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={level}
                                                        className={`flex flex-col items-center justify-between rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-slate-50
                                                            peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:bg-red-50 peer-data-[state=checked]:text-red-700
                                                            ${level === 'EMERGENCY' ? 'border-red-200' : 'border-muted'}
                                                        `}
                                                    >
                                                        <span className="font-bold">{level}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Blood Details */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label>Blood Type</Label>
                                            <select
                                                {...register('bloodType')}
                                                className="w-full p-3 border rounded-md bg-background focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-shadow"
                                            >
                                                <option value="">Select Type</option>
                                                {['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE'].map(t => (
                                                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                            {errors.bloodType && <span className="text-sm text-red-500">Blood type is required</span>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>Units Required</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    {...register('units', { valueAsNumber: true })}
                                                    className="h-12 text-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Rh Factor</Label>
                                                <div className="relative">
                                                    <select
                                                        {...register('rhFactor')}
                                                        className="w-full p-3 border rounded-md bg-background h-12 appearance-none"
                                                    >
                                                        <option value="POSITIVE">Positive (+)</option>
                                                        <option value="NEGATIVE">Negative (-)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Location */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100 text-blue-800">
                                        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                                        <p className="text-sm">
                                            We use your precise location to match you with donors within your specified radius.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <Button
                                            type="button"
                                            onClick={handleGetLocation}
                                            variant="outline"
                                            disabled={isLocating}
                                            className="h-14 border-dashed border-2 relative text-base hover:bg-slate-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                        >
                                            {isLocating ? (
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin text-red-600" />
                                            ) : (
                                                <MapPin className="mr-2 h-5 w-5 text-red-600" />
                                            )}
                                            {isLocating ? 'Acquiring Satellite Location...' : 'Detect My Current Location'}
                                        </Button>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase">Latitude</Label>
                                                <Input
                                                    placeholder="0.000000"
                                                    {...register('latitude', { valueAsNumber: true })}
                                                    readOnly
                                                    className={`bg-slate-50 ${errors.latitude ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase">Longitude</Label>
                                                <Input
                                                    placeholder="0.000000"
                                                    {...register('longitude', { valueAsNumber: true })}
                                                    readOnly
                                                    className={`bg-slate-50 ${errors.longitude ? 'border-red-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        {(errors.latitude || errors.longitude) && (
                                            <p className="text-sm text-red-500 text-center font-medium">
                                                Please click the button above to set your location.
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="text-slate-500 hover:text-slate-900"
                        >
                            Back
                        </Button>

                        {currentStep === 3 ? (
                            <Button
                                type="submit"
                                disabled={createRequest.isPending}
                                className="bg-red-600 hover:bg-red-700 min-w-[140px]"
                            >
                                {createRequest.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Broadcasting...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                        ) : (
                            <Button type="button" onClick={nextStep} className="bg-slate-900 hover:bg-slate-800">
                                Next Step
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}