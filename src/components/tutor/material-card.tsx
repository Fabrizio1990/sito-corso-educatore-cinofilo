'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EditMaterialCategory } from '@/components/tutor/edit-material-category'
import { DeleteMaterialButton } from '@/components/tutor/delete-material-button'

interface MaterialCardProps {
  material: {
    id: string
    title: string
    description?: string | null
    file_path: string | null
    file_type: string | null
    link_url: string | null
    material_type: string | null
    category_id?: string | null
    course_id: string
    created_at: string | null
  }
  showActions?: boolean
}

export function MaterialCard({ material, showActions = true }: MaterialCardProps) {
  const getFileIcon = () => {
    if (material.material_type === 'link') return '🔗'
    const fileType = material.file_type
    if (!fileType) return '📄'
    if (fileType.includes('pdf')) return '📕'
    if (fileType.includes('word') || fileType.includes('doc')) return '📘'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📗'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎬'
    if (fileType.includes('audio')) return '🎵'
    return '📄'
  }

  const getMaterialAction = () => {
    if (material.material_type === 'link') {
      return (
        <a
          href={material.link_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Apri link
        </a>
      )
    }
    return (
      <a
        href={material.file_path || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Scarica
      </a>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-[160px] flex flex-col">
      <CardHeader className="pb-2 flex-1">
        <div className="flex items-start gap-2">
          <span className="text-2xl flex-shrink-0">{getFileIcon()}</span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold line-clamp-2 leading-tight" title={material.title}>
              {material.title}
            </p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {material.material_type === 'link' ? (
                <Badge variant="outline" className="text-xs">Link</Badge>
              ) : material.file_type && (
                <Badge variant="secondary" className="text-xs">
                  {material.file_type.split('/').pop()?.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <EditMaterialCategory
                materialId={material.id}
                materialTitle={material.title}
                courseId={material.course_id}
                currentCategoryId={material.category_id || null}
              />
              <DeleteMaterialButton
                materialId={material.id}
                materialTitle={material.title}
                filePath={material.file_path}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          {getMaterialAction()}
          {material.created_at && (
            <p className="text-xs text-gray-400">
              {new Date(material.created_at).toLocaleDateString('it-IT')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
