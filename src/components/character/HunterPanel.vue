<template>
  <div v-if="char" class="q-pb-xl">

    <!-- Stammdaten -->
    <div class="text-overline text-primary q-mb-xs">Stammdaten</div>
    <q-card flat bordered class="q-mb-sm">
      <q-card-section class="q-pa-sm q-gutter-xs">
        <q-input
          :model-value="char.name"
          label="Name" dense
          @update:model-value="v => store.updateField('name', String(v))"
        />
        <div class="row" style="gap:8px">
          <q-input
            :model-value="char.level"
            label="Stufe" type="number" dense class="col-3"
            @update:model-value="v => store.updateField('level', Math.max(1, Number(v)))"
          />
          <q-input
            :model-value="char.volk"
            label="Volk" dense class="col"
            @update:model-value="v => store.updateField('volk', String(v))"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Rollen (jetzt vor Profession) -->
    <div class="text-overline text-primary q-mb-xs">Rollen</div>
    <q-card flat bordered class="q-mb-sm">
      <q-card-section class="q-pa-sm q-gutter-xs">
        <q-input
          :model-value="char.roles[0]"
          label="Rolle 1" dense
          @update:model-value="v => store.updateField('roles', [String(v), char!.roles[1], char!.roles[2]] as [string,string,string])"
        />
        <q-input
          :model-value="char.roles[1]"
          label="Rolle 2" dense
          @update:model-value="v => store.updateField('roles', [char!.roles[0], String(v), char!.roles[2]] as [string,string,string])"
        />
        <q-input
          :model-value="char.roles[2]"
          label="Rolle 3" dense
          @update:model-value="v => store.updateField('roles', [char!.roles[0], char!.roles[1], String(v)] as [string,string,string])"
        />
      </q-card-section>
    </q-card>

    <!-- Profession -->
    <div class="text-overline text-primary q-mb-xs">Profession</div>
    <q-card flat bordered class="q-mb-sm">
      <q-card-section class="q-pa-sm q-gutter-xs">
        <q-input
          :model-value="char.profession"
          label="Profession" dense
          @update:model-value="v => store.updateField('profession', String(v))"
        />
        <q-input
          :model-value="char.masterProfession"
          label="Meisterprofession" dense
          @update:model-value="v => store.updateField('masterProfession', String(v))"
        />
      </q-card-section>
    </q-card>

    <!-- Motivation (optional) -->
    <template v-if="char.settings.useOptionalMotivations">
      <div class="text-overline text-primary q-mb-xs">Motivation</div>
      <q-card flat bordered class="q-mb-sm">
        <q-card-section class="q-pa-sm q-gutter-xs">
          <q-input
            :model-value="char.motivation.name"
            label="Name der Motivation" dense
            @update:model-value="v => store.updateField('motivation', { ...char!.motivation, name: String(v) })"
          />
          <div class="text-caption text-grey-6 q-mb-xs">Auswirkung</div>
          <q-editor
            :model-value="char.motivation.effectText"
            min-height="4rem"
            :toolbar="editorToolbar"
            :definitions="editorDefinitions"
            @update:model-value="v => store.updateField('motivation', { ...char!.motivation, effectText: v })"
          />
        </q-card-section>
      </q-card>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from 'src/stores/characterStore'
import { editorToolbar, editorDefinitions } from 'src/composables/useEditorConfig'

const store = useCharacterStore()
const char = computed(() => store.activeCharacter)
</script>
