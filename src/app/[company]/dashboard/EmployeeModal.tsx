'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/utils/cropImage'

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData?: any
  isEdit?: boolean
}

export default function EmployeeModal({ isOpen, onClose, onSave, initialData, isEdit }: EmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    hierarchy_level: '',
    photo_url: ''
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  
  // Estados para el Cropper
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        position: initialData?.position || '',
        hierarchy_level: initialData?.hierarchy_level || '',
        photo_url: initialData?.photo_url || ''
      })
      setSelectedFile(null)
      setCroppedPreviewUrl(null)
      setImageSrc(null)
      setIsCropping(false)
      setError('')
    }
  }, [isOpen, initialData])

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null)
        setIsCropping(true) // Mostrar editor de recorte
      })
      reader.readAsDataURL(file)
    }
  }

  const handleCropSave = async () => {
    try {
      if (imageSrc && croppedAreaPixels) {
        const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels)
        if (croppedFile) {
          setSelectedFile(croppedFile)
          setCroppedPreviewUrl(URL.createObjectURL(croppedFile))
        }
      }
      setIsCropping(false) // Volver al formulario principal
    } catch (e) {
      setError('Error al recortar la imagen')
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let finalPhotoUrl = formData.photo_url

      if (selectedFile) {
        // Subir archivo a Supabase Storage
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.jpeg`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, selectedFile, { upsert: false })

        if (uploadError) {
          throw new Error('Error subiendo imagen: ' + uploadError.message)
        }

        // Obtener URL Pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
          
        finalPhotoUrl = publicUrl
      }

      await onSave({ ...formData, photo_url: finalPhotoUrl })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {isCropping ? (
          // --- VISTA DE RECORTE ---
          <div className="h-[500px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Ajustar Foto</h2>
              <button onClick={() => setIsCropping(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">Cancelar</button>
            </div>
            
            <div className="relative flex-1 bg-gray-900 w-full">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // Cuadrado perfecto (1:1)
                  cropShape="round" // Guía visual redonda
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100">
               <input
                 type="range"
                 value={zoom}
                 min={1}
                 max={3}
                 step={0.1}
                 aria-labelledby="Zoom"
                 onChange={(e) => {
                   setZoom(Number(e.target.value))
                 }}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4"
               />
               <button 
                 onClick={handleCropSave}
                 className="w-full px-4 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
                 style={{backgroundColor: 'var(--brand-color)'}}
               >
                 Recortar y Guardar Foto
               </button>
            </div>
          </div>
        ) : (
          // --- VISTA DEL FORMULARIO PRINCIPAL ---
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? 'Editar Empleado' : 'Añadir Empleado'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Cargo</label>
                <input 
                  type="text"
                  required 
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ej: Director de Ventas"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Nivel Jerárquico</label>
                <select 
                  required
                  value={formData.hierarchy_level}
                  onChange={e => setFormData({...formData, hierarchy_level: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="" disabled>Selecciona un nivel...</option>
                  <option value="Nivel 0 = Gerente General - CEO">Nivel 0 = Gerente General - CEO</option>
                  <option value="Nivel 1 = Gerentes">Nivel 1 = Gerentes</option>
                  <option value="Nivel 2 = Jefes">Nivel 2 = Jefes</option>
                  <option value="Nivel 3 = Coordinadores">Nivel 3 = Coordinadores</option>
                  <option value="Nivel 4 = Asistentes">Nivel 4 = Asistentes</option>
                  <option value="Nivel 5 = Auxiliares">Nivel 5 = Auxiliares</option>
                  <option value="Nivel 6 = Operativos">Nivel 6 = Operativos</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Foto del Empleado (Opcional)</label>
                <div className="flex items-center gap-4">
                  {/* Vista Previa de la foto actual o la recortada */}
                  {(croppedPreviewUrl || formData.photo_url) && (
                    <img 
                      src={croppedPreviewUrl || formData.photo_url} 
                      alt="Current" 
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm" 
                    />
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50" style={{backgroundColor: 'var(--brand-color)'}}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
