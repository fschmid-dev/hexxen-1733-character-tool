<template>
  <q-dialog :model-value="modelValue" maximized @update:model-value="$emit('update:modelValue', $event)">
    <q-card>
      <q-card-section class="row items-center bg-primary text-white q-pa-sm">
        <q-icon name="menu_book" class="q-mr-sm" />
        <div class="text-h6 col">Journal</div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <!-- Suche + Tag-Filter -->
      <q-card-section class="q-pa-sm q-pb-none">
        <div class="row q-gutter-sm items-center">
          <q-input
            v-model="search" placeholder="Suchen..." dense outlined clearable class="col"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
          <q-btn round color="primary" icon="add" size="sm" @click="openNewNote" />
        </div>
        <div v-if="allTags.length" class="row q-gutter-xs q-mt-xs">
          <q-chip
            v-for="tag in allTags" :key="tag" dense clickable
            :color="activeTag === tag ? 'primary' : 'grey-3'"
            :text-color="activeTag === tag ? 'white' : 'grey-8'"
            @click="activeTag = activeTag === tag ? '' : tag"
          >
            {{ tag }}
          </q-chip>
        </div>
      </q-card-section>

      <!-- Notizen-Liste -->
      <q-card-section class="q-pa-sm" style="overflow-y:auto; flex:1">
        <div v-if="filteredNotes.length === 0" class="text-grey-5 text-center q-mt-lg">
          <q-icon name="note_add" size="48px" />
          <div class="q-mt-sm text-body2">{{ search ? 'Keine Treffer' : 'Noch keine Notizen' }}</div>
        </div>
        <div class="q-gutter-sm">
          <q-card
            v-for="note in filteredNotes" :key="note.id"
            flat bordered clickable
            @click="openEditNote(note)"
          >
            <q-card-section class="q-pa-sm">
              <div class="row items-center">
                <div class="col text-subtitle2 text-weight-medium">{{ note.title || 'Ohne Titel' }}</div>
                <q-btn flat round dense icon="delete_outline" size="xs" color="negative"
                  @click.stop="store.removeJournalNote(note.id)" />
              </div>
              <div v-if="note.tags.length" class="row q-gutter-xs q-mt-xs">
                <q-badge v-for="tag in note.tags" :key="tag" color="grey-4" text-color="grey-8" :label="tag" />
              </div>
              <div
                class="text-caption text-grey-6 q-mt-xs"
                style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden"
                v-html="note.content"
              />
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>

    <!-- Notiz-Bearbeitungs-Dialog (innerhalb des Journals) -->
    <q-dialog v-model="showNoteDialog" maximized>
      <q-card>
        <q-card-section class="row items-center bg-primary text-white q-pa-sm">
          <div class="text-h6 col">{{ editingNote ? 'Notiz bearbeiten' : 'Neue Notiz' }}</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-gutter-sm q-pa-md">
          <q-input v-model="noteForm.title" label="Titel" dense autofocus />
          <q-input v-model="noteForm.tagsInput" label="Tags (kommagetrennt)" dense
            hint="z.B. Kampf, NPC, Hinweis" />
          <div class="text-caption text-grey-6 q-mb-xs">Inhalt</div>
          <q-editor v-model="noteForm.content" min-height="12rem" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Abbrechen" v-close-popup />
          <q-btn color="primary" label="Speichern" @click="saveNote" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
import { useCharacterStore } from 'src/stores/characterStore'
import type { JournalNote } from 'src/types/character'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)

const search = ref('')
const activeTag = ref('')

const allTags = computed(() => {
  const tags = new Set<string>()
  char.value?.journalNotes.forEach(n => n.tags.forEach(t => tags.add(t)))
  return [...tags]
})

const filteredNotes = computed(() => {
  let notes = char.value?.journalNotes ?? []
  if (activeTag.value) notes = notes.filter(n => n.tags.includes(activeTag.value))
  if (!search.value.trim()) return notes
  const fuse = new Fuse(notes, { keys: ['title', 'tags'], threshold: 0.4 })
  return fuse.search(search.value).map(r => r.item)
})

const showNoteDialog = ref(false)
const editingNote = ref<JournalNote | null>(null)
const noteForm = ref({ title: '', content: '', tagsInput: '' })

function openNewNote() {
  editingNote.value = null
  noteForm.value = { title: '', content: '', tagsInput: '' }
  showNoteDialog.value = true
}

function openEditNote(note: JournalNote) {
  editingNote.value = note
  noteForm.value = { title: note.title, content: note.content, tagsInput: note.tags.join(', ') }
  showNoteDialog.value = true
}

function saveNote() {
  const tags = noteForm.value.tagsInput.split(',').map(t => t.trim()).filter(Boolean)
  const data = { title: noteForm.value.title, content: noteForm.value.content, tags }
  if (editingNote.value) store.updateJournalNote(editingNote.value.id, data)
  else store.addJournalNote(data)
  showNoteDialog.value = false
}
</script>
