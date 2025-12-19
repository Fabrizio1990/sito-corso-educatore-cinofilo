'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Search, FileText, Link as LinkIcon, Download, Trash2, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ManageCategoriesDialog } from './manage-categories-dialog'
import { UploadMaterialDialog } from './upload-material-dialog'

export interface MaterialInstance {
    id: string
    title: string
    description: string | null
    created_at: string
    course_name: string
    category_name: string | null
}

export interface LibraryItem {
    key: string // file_path or link_url
    title: string
    type: 'file' | 'link'
    file_type?: string
    instances: MaterialInstance[]
}

export interface MaterialsManagerProps {
    initialMaterials: LibraryItem[], 
    courses: { id: string, name: string }[],
    adminMode?: boolean,
    library: LibraryItem[], // This seems redundant with initialMaterials, but keeping it as per instruction
    showLibraryTab?: boolean
}

export function MaterialsManager({ initialMaterials, courses, library, adminMode = false, showLibraryTab = true }: MaterialsManagerProps) {
    console.log('MaterialsManager library:', library)
    const [materials, setMaterials] = useState<LibraryItem[]>(initialMaterials)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const router = useRouter()
    const supabase = createClient()

    const toggleRow = (key: string) => {
        const newSet = new Set(expandedRows)
        if (newSet.has(key)) {
            newSet.delete(key)
        } else {
            newSet.add(key)
        }
        setExpandedRows(newSet)
    }

    const filteredLibrary = library.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instances.some(i => i.course_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler rimuovere questo materiale dal corso?')) return

        const { error } = await supabase.from('materials').delete().eq('id', id)
        
        if (error) {
            toast.error('Errore durante l\'eliminazione')
        } else {
            toast.success('Materiale rimosso')
            router.refresh()
        }
    }

    const getIcon = (item: LibraryItem) => {
        if (item.type === 'link') return <LinkIcon className="h-4 w-4 text-blue-500" />
        return <FileText className="h-4 w-4 text-orange-500" />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cerca materiali o corsi..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <ManageCategoriesDialog courses={courses} />
                    <UploadMaterialDialog 
                  courses={courses} 
                  library={library}
                  showLibraryTab={showLibraryTab} 
                />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead>Materiale</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Associazioni</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLibrary.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Nessun materiale trovato.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLibrary.map((item) => (
                                <>
                                    <TableRow key={item.key} className="group hover:bg-muted/50">
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleRow(item.key)}>
                                                {expandedRows.has(item.key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {getIcon(item)}
                                                {item.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {item.type === 'link' ? 'Link' : item.file_type || 'File'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {item.instances.slice(0, 2).map(inst => (
                                                    <Badge key={inst.id} variant="secondary" className="text-[10px]">
                                                        {inst.course_name}
                                                    </Badge>
                                                ))}
                                                {item.instances.length > 2 && (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        +{item.instances.length - 2} altri
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {item.type === 'link' ? (
                                                    <a href={item.key} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                ) : (
                                                    <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/materials/${item.key}`} download>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(item.key) && (
                                        <TableRow className="bg-muted/30">
                                            <TableCell colSpan={5} className="p-0">
                                                <div className="p-4 pl-12 space-y-2">
                                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Dettagli Associazioni</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-b-0 hover:bg-transparent">
                                                                <TableHead className="h-8 text-xs">Corso</TableHead>
                                                                <TableHead className="h-8 text-xs">Categoria</TableHead>
                                                                <TableHead className="h-8 text-xs">Data Caricamento</TableHead>
                                                                <TableHead className="h-8 text-xs text-right">Rimuovi</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {item.instances.map(instance => (
                                                                <TableRow key={instance.id} className="border-b-0 hover:bg-transparent">
                                                                    <TableCell className="py-2 text-sm">{instance.course_name}</TableCell>
                                                                    <TableCell className="py-2 text-sm">{instance.category_name || '-'}</TableCell>
                                                                    <TableCell className="py-2 text-sm">
                                                                        {format(new Date(instance.created_at), 'dd MMM yyyy', { locale: it })}
                                                                    </TableCell>
                                                                    <TableCell className="py-2 text-right">
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={() => handleDelete(instance.id)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
