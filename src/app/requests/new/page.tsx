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
import { AlertCircle, CheckCircle2, MapPin } from 'lucide-react'

// Validation Schema
const requestSchema = z.object({
    bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']),
    units: z.number().min(1).max(10),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY']),
    latitude: z.number(),
    longitude: z.number(),
    // Add other fields as per your Prisma schema
})

type FormData = z.infer<typeof requestSchema>

const steps = [
    { id: 1, title: 'Patient Details' },
    { id: 2, title: 'Blood Requirements' },
    { id: 3, title: 'Location' },
]

export default function NewRequestPage() {
    const [currentStep, setCurrentStep] = useState(1)
    const router = useRouter()
    const createRequest = useCreateBloodRequest()

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
            urgency: 'MEDIUM',
            units: 1
        }
    })

    // Mock location fetching
    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setValue('latitude', pos.coords.latitude)
                setValue('longitude', pos.coords.longitude)
            })
        }
    }

    const onSubmit = (data: FormData) => {
        createRequest.mutate(data, {
            onSuccess: () => router.push('/dashboard')
        })
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col">

                {/* Progress Header */}
                <div className="bg-slate-900 p-6 text-white">
                    <h2 className="text-2xl font-bold">New Blood Request</h2>
                    <div className="flex items-center mt-6 gap-2">
                        {steps.map((step) => (
                            <div key={step.id} className="flex-1 flex flex-col items-center relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${
                                    step.id <= currentStep ? 'bg-red-600' : 'bg-slate-700'
                                }`}>
                                    {step.id < currentStep ? <CheckCircle2 size={16} /> : step.id}
                                </div>
                                <span className="text-xs mt-2 text-slate-400">{step.title}</span>
                                {/* Connecting Line */}
                                {step.id !== 3 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${
                                        step.id < currentStep ? 'bg-red-600' : 'bg-slate-800'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 flex-1">
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
                                    <Label>Urgency Level</Label>
                                    <RadioGroup
                                        onValueChange={(val: any) => setValue('urgency', val)}
                                        defaultValue="MEDIUM"
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY'].map((level) => (
                                            <div key={level}>
                                                <RadioGroupItem value={level} id={level} className="peer sr-only" />
                                                <Label
                                                    htmlFor={level}
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 [&:has([data-state=checked])]:border-red-600 cursor-pointer transition-all"
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
                                <div className="grid gap-4">
                                    <Label>Blood Type</Label>
                                    <select
                                        {...register('bloodType')}
                                        className="w-full p-3 border rounded-md bg-background"
                                    >
                                        <option value="">Select Type</option>
                                        {['A_POSITIVE', 'O_POSITIVE', 'B_POSITIVE', 'AB_POSITIVE', 'A_NEGATIVE', 'O_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE'].map(t => (
                                            <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                        ))}
                                    </select>

                                    <Label>Units Required</Label>
                                    <Input type="number" {...register('units', { valueAsNumber: true })} />
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
                                    <AlertCircle className="h-5 w-5 mt-0.5" />
                                    <p className="text-sm">
                                        We use your location to match you with the nearest donors using AI algorithms.
                                        Please ensure it&#39;s accurate.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <Button type="button" onClick={handleGetLocation} variant="outline" className="h-12 border-dashed">
                                        <MapPin className="mr-2 h-4 w-4" /> Use Current Location
                                    </Button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="Latitude" {...register('latitude', { valueAsNumber: true })} readOnly />
                                        <Input placeholder="Longitude" {...register('longitude', { valueAsNumber: true })} readOnly />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 1}>
                            Back
                        </Button>
                        {currentStep === 3 ? (
                            <Button type="submit" disabled={createRequest.isPending} className="bg-red-600 hover:bg-red-700">
                                {createRequest.isPending ? 'Processing...' : 'Submit Request'}
                            </Button>
                        ) : (
                            <Button type="button" onClick={nextStep}>Next Step</Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}