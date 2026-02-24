<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface SubmissionFile {
  name: string;
  url: string;
  type: string;
}

interface Submission {
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'late' | 'not-submitted';
  score?: number;
  fileUrl?: string;
  comment?: string;
  files?: SubmissionFile[];
}

const props = defineProps<{
  submission: Submission;
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Active PDF tab index
const activePdfIndex = ref(0);

// Reset tab when modal opens or submission changes
watch(() => props.visible, (val) => {
  if (val) activePdfIndex.value = 0;
});

// PDF files only
const pdfFiles = computed(() => {
  return props.submission.files?.filter(f => f.type === 'application/pdf') ?? [];
});

// Current PDF URL for iframe
const currentPdfUrl = computed(() => {
  if (pdfFiles.value.length === 0) return null;
  return pdfFiles.value[activePdfIndex.value]?.url ?? null;
});

// Status helpers
const getStatusClass = (status: string): string => {
  switch (status) {
    case 'submitted': return 'status-submitted';
    case 'late': return 'status-late';
    case 'not-submitted': return 'status-not-submitted';
    default: return '';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'submitted': return '제출 완료';
    case 'late': return '지각 제출';
    case 'not-submitted': return '미제출';
    default: return '';
  }
};

// Close on overlay click
const handleOverlayClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close');
  }
};

// Download file
const downloadFile = (file: SubmissionFile) => {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.name;
  link.click();
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-box">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-header-info">
            <div class="modal-avatar">{{ submission.studentName.charAt(0) }}</div>
            <div class="modal-student-info">
              <p class="modal-student-name">{{ submission.studentName }}</p>
              <p class="modal-student-id">{{ submission.studentId }}</p>
            </div>
          </div>
          <div class="modal-header-right">
            <span class="status-badge" :class="getStatusClass(submission.status)">
              {{ getStatusText(submission.status) }}
            </span>
            <button class="modal-close-btn" @click="emit('close')" title="닫기">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Body: not-submitted state -->
        <div v-if="submission.status === 'not-submitted'" class="not-submitted-state">
          <i class="bi bi-inbox"></i>
          <p>제출 내역이 없습니다</p>
          <span>아직 과제를 제출하지 않은 학생입니다.</span>
        </div>

        <!-- Body: submitted content -->
        <div v-else class="modal-body">
          <!-- Left: PDF Preview -->
          <div class="modal-left-panel">
            <!-- PDF tabs when multiple files -->
            <div v-if="pdfFiles.length > 1" class="pdf-tabs">
              <button
                v-for="(file, idx) in pdfFiles"
                :key="idx"
                class="pdf-tab"
                :class="{ active: activePdfIndex === idx }"
                @click="activePdfIndex = idx"
              >
                {{ file.name }}
              </button>
            </div>

            <!-- PDF viewer -->
            <div class="pdf-viewer">
              <iframe
                v-if="currentPdfUrl"
                :src="currentPdfUrl"
                title="PDF 미리보기"
              ></iframe>
              <div v-else class="no-file-placeholder">
                <i class="bi bi-file-earmark-x"></i>
                <p>제출된 파일이 없습니다</p>
              </div>
            </div>
          </div>

          <!-- Right: Info -->
          <div class="modal-right-panel">
            <!-- Meta Info -->
            <div class="modal-meta-section">
              <h4>제출 정보</h4>
              <div class="meta-item">
                <span class="meta-label">제출 시간</span>
                <span class="meta-value">{{ submission.submittedAt }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">상태</span>
                <span class="status-badge" :class="getStatusClass(submission.status)">
                  {{ getStatusText(submission.status) }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">점수</span>
                <span v-if="submission.score != null" class="meta-value score-value">{{ submission.score }}점</span>
                <span v-else class="meta-value" style="color: #9ca3af;">미채점</span>
              </div>
            </div>

            <!-- Comment -->
            <div class="modal-comment-section">
              <h4><i class="bi bi-chat-left-text"></i> 슬랙 댓글</h4>
              <p v-if="submission.comment" class="comment-text">{{ submission.comment }}</p>
              <p v-else class="no-comment">작성된 댓글이 없습니다.</p>
            </div>

            <!-- File List -->
            <div class="modal-files-section">
              <h4><i class="bi bi-paperclip"></i> 제출 파일</h4>
              <div v-if="submission.files && submission.files.length > 0" class="file-list">
                <div v-for="(file, idx) in submission.files" :key="idx" class="file-item">
                  <div class="file-info">
                    <i class="bi bi-file-earmark-pdf"></i>
                    <span class="file-name">{{ file.name }}</span>
                  </div>
                  <button class="file-download-btn" @click="downloadFile(file)" title="다운로드">
                    <i class="bi bi-download"></i>
                  </button>
                </div>
              </div>
              <p v-else class="no-files">제출된 파일이 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style src="../assets/css/submission-modal.css"></style>
