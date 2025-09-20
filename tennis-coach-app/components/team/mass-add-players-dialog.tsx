'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTeamStore } from '@/stores/team-store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Users, FileText, Plus, X, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// Schema for individual player in bulk form (form input - accepts strings)
const bulkPlayerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.enum(['male', 'female']),
  grade: z.number().min(9).max(12).optional(),
  position_preference: z.enum(['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles']).optional(),
  team_level: z.enum(['varsity', 'jv', 'freshman']).optional(),
  utr_rating: z.string().optional(),
})

// Schema for processing (transforms strings to numbers)
const bulkPlayerProcessSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  gender: z.enum(['male', 'female']),
  grade: z.number().min(9).max(12).optional(),
  position_preference: z.enum(['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles']).optional(),
  team_level: z.enum(['varsity', 'jv', 'freshman']).optional(),
  utr_rating: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  }),
})

const massAddSchema = z.object({
  players: z.array(bulkPlayerFormSchema).min(1, 'At least one player is required')
})

type MassAddFormData = z.infer<typeof massAddSchema>
type BulkPlayerData = z.infer<typeof bulkPlayerProcessSchema>

interface MassAddPlayersDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MassAddPlayersDialog({ teamId, open, onOpenChange }: MassAddPlayersDialogProps) {
  const { addPlayer } = useTeamStore()
  const [activeTab, setActiveTab] = useState('form')
  const [csvData, setCsvData] = useState<string>('')
  const [parsedPlayers, setParsedPlayers] = useState<BulkPlayerData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [csvError, setCsvError] = useState<string>('')
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MassAddFormData>({
    resolver: zodResolver(massAddSchema),
    defaultValues: {
      players: [{ name: '', gender: 'male', grade: undefined, position_preference: undefined, team_level: undefined, utr_rating: '' }]
    }
  })

  const watchedPlayers = watch('players')

  // Add new player row to form
  const addPlayerRow = () => {
    const currentPlayers = watchedPlayers || []
    setValue('players', [
      ...currentPlayers,
      { name: '', gender: 'male', grade: undefined, position_preference: undefined, team_level: undefined, utr_rating: '' }
    ])
  }

  // Remove player row from form
  const removePlayerRow = (index: number) => {
    const currentPlayers = watchedPlayers || []
    if (currentPlayers.length > 1) {
      setValue('players', currentPlayers.filter((_, i) => i !== index))
    }
  }

  // Parse CSV data
  const parseCSV = (csvText: string): BulkPlayerData[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const players: BulkPlayerData[] = []

    // Expected headers
    const expectedHeaders = ['name', 'gender', 'grade', 'team_level', 'position_preference', 'utr_rating']
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has incorrect number of columns`)
      }

      const player: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        const value = values[index]
        
        switch (header) {
          case 'name':
            player.name = value
            break
          case 'gender':
            if (value && !['male', 'female'].includes(value.toLowerCase())) {
              throw new Error(`Row ${i + 1}: Invalid gender. Must be 'male' or 'female'`)
            }
            player.gender = value?.toLowerCase() || 'male'
            break
          case 'grade':
            player.grade = value ? parseInt(value) : undefined
            break
          case 'team_level':
            if (value && !['varsity', 'jv', 'freshman'].includes(value.toLowerCase())) {
              throw new Error(`Row ${i + 1}: Invalid team_level. Must be 'varsity', 'jv', or 'freshman'`)
            }
            player.team_level = value?.toLowerCase() || undefined
            break
          case 'position_preference':
            if (value && !['boys_singles', 'girls_singles', 'boys_doubles', 'girls_doubles', 'mixed_doubles'].includes(value.toLowerCase())) {
              throw new Error(`Row ${i + 1}: Invalid position_preference`)
            }
            player.position_preference = value?.toLowerCase() || undefined
            break
          case 'utr_rating':
            player.utr_rating = value || ''
            break
        }
      })

      // Validate required fields
      if (!player.name) {
        throw new Error(`Row ${i + 1}: Name is required`)
      }

      // Transform the player data using the processing schema
      const processedPlayer = bulkPlayerProcessSchema.parse(player)
      players.push(processedPlayer)
    }

    return players
  }

  // Handle CSV upload
  const handleCSVUpload = () => {
    try {
      setCsvError('')
      const players = parseCSV(csvData)
      setParsedPlayers(players)
      toast.success(`Successfully parsed ${players.length} players from CSV`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV'
      setCsvError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Submit form data (both form and CSV)
  const onSubmit = async (data?: MassAddFormData) => {
    setIsLoading(true)
    setSuccessCount(0)
    setErrorCount(0)

    try {
      let playersToAdd: BulkPlayerData[] = []

      if (activeTab === 'form' && data) {
        // Transform form data using processing schema
        playersToAdd = data.players
          .filter(p => p.name.trim() !== '')
          .map(player => bulkPlayerProcessSchema.parse(player))
      } else if (activeTab === 'csv' && parsedPlayers.length > 0) {
        playersToAdd = parsedPlayers
      }

      if (playersToAdd.length === 0) {
        toast.error('No valid players to add')
        return
      }

      // Add players one by one
      for (const playerData of playersToAdd) {
        try {
          const { error } = await addPlayer({
            team_id: teamId,
            name: playerData.name,
            gender: playerData.gender,
            grade: playerData.grade,
            position_preference: playerData.position_preference || undefined,
            team_level: playerData.team_level || undefined,
            utr_rating: playerData.utr_rating,
          })

          if (error) {
            console.error(`Error adding player ${playerData.name}:`, error)
            setErrorCount(prev => prev + 1)
          } else {
            setSuccessCount(prev => prev + 1)
          }
        } catch (error) {
          console.error(`Error adding player ${playerData.name}:`, error)
          setErrorCount(prev => prev + 1)
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} players`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to add ${errorCount} players`)
      }

      // Reset form and close dialog
      reset()
      setCsvData('')
      setParsedPlayers([])
      onOpenChange(false)

    } catch (error) {
      console.error('Error in mass add:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCsvData(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mass Add Players
          </DialogTitle>
          <DialogDescription>
            Add multiple players to your team at once using either a form or CSV upload.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Form Entry
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Add Players via Form</h3>
                <Button type="button" onClick={addPlayerRow} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {watchedPlayers?.map((_, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Player {index + 1}</h4>
                      {watchedPlayers.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removePlayerRow(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`players.${index}.name`}>Name *</Label>
                        <Input
                          {...register(`players.${index}.name`)}
                          placeholder="Player name"
                        />
                        {errors.players?.[index]?.name && (
                          <p className="text-xs text-red-600">{errors.players[index]?.name?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`players.${index}.gender`}>Gender *</Label>
                        <Select
                          value={watchedPlayers[index]?.gender || 'male'}
                          onValueChange={(value) => setValue(`players.${index}.gender`, value as 'male' | 'female')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`players.${index}.grade`}>Grade</Label>
                        <Select
                          value={watchedPlayers[index]?.grade?.toString() || ''}
                          onValueChange={(value) => setValue(`players.${index}.grade`, value ? parseInt(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9">9th Grade</SelectItem>
                            <SelectItem value="10">10th Grade</SelectItem>
                            <SelectItem value="11">11th Grade</SelectItem>
                            <SelectItem value="12">12th Grade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`players.${index}.team_level`}>Team Level</Label>
                        <Select
                          value={watchedPlayers[index]?.team_level || ''}
                          onValueChange={(value) => setValue(`players.${index}.team_level`, value as 'varsity' | 'jv' | 'freshman')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="varsity">Varsity</SelectItem>
                            <SelectItem value="jv">Junior Varsity</SelectItem>
                            <SelectItem value="freshman">Freshman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`players.${index}.position_preference`}>Position Preference</Label>
                        <Select
                          value={watchedPlayers[index]?.position_preference || ''}
                          onValueChange={(value) => setValue(`players.${index}.position_preference`, value as 'boys_singles' | 'girls_singles' | 'boys_doubles' | 'girls_doubles' | 'mixed_doubles')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boys_singles">Boys Singles</SelectItem>
                            <SelectItem value="girls_singles">Girls Singles</SelectItem>
                            <SelectItem value="boys_doubles">Boys Doubles</SelectItem>
                            <SelectItem value="girls_doubles">Girls Doubles</SelectItem>
                            <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`players.${index}.utr_rating`}>UTR Rating</Label>
                        <Input
                          {...register(`players.${index}.utr_rating`)}
                          type="number"
                          min="1"
                          max="16"
                          step="0.1"
                          placeholder="e.g., 8.5"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding Players...' : `Add ${watchedPlayers?.filter(p => p.name.trim()).length || 0} Players`}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file with player data. Download the template below for the correct format.
                </p>
                
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const csvTemplate = 'name,gender,grade,team_level,position_preference,utr_rating\nJohn Smith,male,10,varsity,boys_singles,8.5\nJane Doe,female,11,jv,girls_doubles,7.2'
                      const blob = new Blob([csvTemplate], { type: 'text/csv' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'players_template.csv'
                      a.click()
                      window.URL.revokeObjectURL(url)
                    }}
                  >
                    Download Template
                  </Button>
                  
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="csvData">Or paste CSV data directly:</Label>
                <textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="name,gender,grade,team_level,position_preference,utr_rating&#10;John Smith,male,10,varsity,boys_singles,8.5&#10;Jane Doe,female,11,jv,girls_doubles,7.2"
                  className="w-full h-32 p-3 border rounded-md font-mono text-sm"
                />
                {csvError && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{csvError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button onClick={handleCSVUpload} disabled={!csvData.trim()}>
                Parse CSV Data
              </Button>

              {parsedPlayers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Parsed Players ({parsedPlayers.length})
                    </CardTitle>
                    <CardDescription>
                      Review the parsed players before adding them to your team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {parsedPlayers.map((player, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{player.name}</span>
                            <div className="flex gap-2 text-xs text-gray-600">
                              <Badge variant="outline">{player.gender}</Badge>
                              {player.grade && <Badge variant="outline">Grade {player.grade}</Badge>}
                              {player.team_level && <Badge variant="outline">{player.team_level}</Badge>}
                              {player.utr_rating && <Badge variant="outline">UTR {player.utr_rating}</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => onSubmit()} 
                  disabled={isLoading || parsedPlayers.length === 0}
                >
                  {isLoading ? 'Adding Players...' : `Add ${parsedPlayers.length} Players`}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
