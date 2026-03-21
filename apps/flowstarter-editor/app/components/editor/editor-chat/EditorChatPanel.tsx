/* eslint-disable no-restricted-imports */
/**
 * EditorChatPanel — Phase Router
 *
 * Simplified from 500+ lines to a clean phase router.
 * Each step renders a self-contained component.
 */

import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { themeStore, getEffectiveTheme } from '~/lib/stores/theme';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { EditorUserMessage, EditorAssistantMessage, EditorMessageWrapper } from '../EditorMessage';
import { TemplatePreviewDialog } from '../TemplatePreviewDialog';
import { useOptionalConversationContext } from '../ConversationContext';

import { useEditorChatState, useAttachments, useFontsLoader, useConvexSync, useMessagePagination, useActivityEvents } from './hooks';
import { ColorPaletteToColorPalette } from './utils';
import {
  TemplateGallery,
  PaletteSelector,
  CustomPaletteModal,
  FontSelector,
  PersonalizationPanel,
  IntegrationModal,
  BusinessDetailsForm,
  ChatInput,
  TypingIndicator,
  CreatingIndicator,
  QuickProfileSelector,
  AgentActivityLog,
  BuildActivityFeed,
} from './components';
import type { EditorChatPanelProps } from './types';
import { AgentStatusMessage } from '~/components/editor/AgentStatusMessage';

export function EditorChatPanel({
  userName = 'You',
  userAvatar,
  initialState,
  projectId: externalProjectId,
  onProjectReady,
  onStepChange,
  onPreviewChange,
  onStateChange,
  onOrchestrationStatusChange,
  onOpenTerminal,
}: EditorChatPanelProps) {
  const theme = useStore(themeStore);
  const effectiveTheme = theme === 'system' ? getEffectiveTheme() : theme;
  const isDark = effectiveTheme === 'dark';

  // Load fonts
  const { fontsLoaded, fontError } = useFontsLoader();
  useEffect(() => {
    if (fontError) console.warn('[EditorChatPanel] Font loading issue:', fontError);
  }, [fontError]);

  // Chat state management
  const {
    messages,
    inputValue,
    setInputValue,
    step,
    suggestedReplies,
    isTyping,
    previewTemplate,
    previewPalette,
    templatePalette,
    showCustomPalette,
    setShowCustomPalette,
    customColors,
    setCustomColors,
    setSelectedPalette,
    messagesEndRef,
    templates,
    selectedTemplate,
    templatesLoading,
    templatesError,
    refetchTemplates,
    isCloning,
    agentRunning,
    orchestratorStatus,
    orchestratorRunning,
    stopOrchestration,
    buildStep,
    buildProgress,
    buildPhase,
    recommendations,
    recommendationsLoading,
    recommendationsError,
    selectedRecommendation,
    fetchRecommendations,
    businessInfo,
    selectedPalette,
    selectedFont,
    selectedLogo,
    projectName,
    projectDescription,
    currentUrlId,
    quickProfile,
    suggestedQuickProfile,
    handleQuickProfileComplete,
    businessContext,
    isInternalFlow,
    handleTemplateSelect,
    handleRecommendationSelect,
    handlePaletteSelect,
    handleFontSelect,
    handleLogoSelect,
    handleContactDetailsComplete,
    handleSkipContactDetails,
    handleIntegrationsComplete,
    handleSkipIntegrations,
    handleBusinessDetailsComplete,
    handleSuggestionAccept,
    handleSend,
    handleThumbnailError,
    refreshSuggestions,
    openPreview,
    setPreviewTemplate,
    previewRecommendation,
    setPreviewRecommendation,
  } = useEditorChatState({ onProjectReady, onPreviewChange, initialState, onStateChange, externalProjectId });

  // Conversation context
  const conversationContext = useOptionalConversationContext();
  const activeConversation = conversationContext?.activeConversation || null;
  const effectiveProjectId = externalProjectId || activeConversation?.projectId || null;

  // Message pagination
  const {
    hasMore: hasMoreMessages,
    isLoadingMore: isLoadingMoreMessages,
    scrollContainerRef: paginationScrollRef,
  } = useMessagePagination({
    conversationId: activeConversation?.id || null,
    pageSize: 30,
    enabled: Boolean(activeConversation?.id),
  });

  // Convex sync
  useConvexSync({
    conversationId: activeConversation?.id || null,
    projectId: effectiveProjectId,
    messages,
    conversationState: {
      step,
      projectDescription: projectDescription || undefined,
      projectName: projectName || undefined,
      selectedTemplateId: initialState?.selectedTemplateId || undefined,
      selectedTemplateName: initialState?.selectedTemplateName || undefined,
      selectedPalette,
      selectedFont,
      selectedLogo,
      businessInfo,
      projectUrlId: currentUrlId || initialState?.projectUrlId || undefined,
      buildPhase: buildPhase || initialState?.buildPhase,
      orchestrationState: initialState?.orchestrationState,
      orchestrationId: initialState?.orchestrationId,
    },
    enabled: Boolean(effectiveProjectId) || Boolean(activeConversation) || messages.length > 0,
    debounceMs: 500,
  });

  // Notify parent of step/orchestration changes
  useEffect(() => { onStepChange?.(step); }, [step, onStepChange]);
  useEffect(() => {
    if (orchestratorStatus) onOrchestrationStatusChange?.(orchestratorStatus);
  }, [orchestratorStatus, onOrchestrationStatusChange]);

  // Attachments
  const {
    attachmentMenuOpen, setAttachmentMenuOpen,
    attachedImages, fileInputRef, attachmentMenuRef,
    handleFileSelect, handleScreenshot, removeAttachedImage, clearAttachedImages,
  } = useAttachments();

  // ── Agent activity events for AgentActivityLog ──
  const activeAgentMsg = messages.findLast(m => m.agentEvents && m.agentEvents.length > 0);
  const rawAgentEvents = activeAgentMsg?.agentEvents ?? [];
  const activityEvents = useActivityEvents(rawAgentEvents);
  const agentIsActive = activeAgentMsg?.isAgentActive ?? false;

  // ── Determine which phases show the chat input ──
  const chatInputVisible =
    step === 'welcome' || step === 'describe' || step === 'name' ||
    step === 'creating' || step === 'ready';

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Background */}
      <FlowBackground variant="editor" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: isDark
          ? `radial-gradient(ellipse at 0% 0%, rgba(77, 93, 217, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse at 100% 30%, rgba(59, 68, 168, 0.06) 0%, transparent 50%),
             radial-gradient(ellipse 130% 70% at 40% 100%, rgba(160, 145, 50, 0.18) 0%, transparent 60%),
             linear-gradient(170deg, rgba(8,8,12,0.85) 0%, rgba(12,11,20,0.8) 40%, rgba(14,13,24,0.82) 70%, rgba(11,10,14,0.85) 100%)`
          : `radial-gradient(ellipse at 0% 0%, rgba(77, 93, 217, 0.12) 0%, transparent 50%),
             radial-gradient(ellipse at 100% 30%, rgba(59, 68, 168, 0.08) 0%, transparent 50%),
             radial-gradient(ellipse 130% 70% at 40% 100%, rgba(180, 160, 50, 0.12) 0%, transparent 60%),
             linear-gradient(170deg, rgba(250,250,252,0.75) 0%, rgba(244,242,250,0.7) 40%, rgba(246,244,248,0.72) 70%, rgba(252,250,246,0.75) 100%)`,
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        pointerEvents: 'none',
      }} />

      {/* Messages + Phase Content */}
      <div
        ref={paginationScrollRef}
        className={`flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 relative z-[1] scrollbar-thin scrollbar-track-transparent ${isDark ? 'scrollbar-thumb-white/10' : 'scrollbar-thumb-black/10'}`}
        style={{ minHeight: 0 }}
      >
        {/* Loading older messages */}
        {isLoadingMoreMessages && (
          <div className="flex justify-center py-3">
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Loading older messages...
            </div>
          </div>
        )}
        {hasMoreMessages && !isLoadingMoreMessages && (
          <div className="flex justify-center py-2">
            <span className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>Scroll up for older messages</span>
          </div>
        )}

        {/* Chat messages */}
        <AnimatePresence>
          {messages.map(msg => (
            <EditorMessageWrapper key={msg.id} id={msg.id}>
              {msg.role === 'assistant' && (
                <EditorAssistantMessage
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isDark={isDark}
                  component={
                    msg.agentEvents && msg.agentEvents.length > 0
                      ? <AgentStatusMessage
                          events={msg.agentEvents}
                          isActive={msg.isAgentActive ?? false}
                          onOpenTerminal={onOpenTerminal}
                        />
                      : msg.component
                  }
                />
              )}
              {msg.role === 'user' && (
                <EditorUserMessage
                  content={msg.content}
                  timestamp={msg.timestamp}
                  userName={userName}
                  userAvatar={userAvatar}
                  isDark={isDark}
                />
              )}
            </EditorMessageWrapper>
          ))}
        </AnimatePresence>

        {/* ── Phase-specific content ── */}

        {/* Quick Profile */}
        {step === 'quick-profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
            <QuickProfileSelector
              initialProfile={suggestedQuickProfile}
              onComplete={handleQuickProfileComplete}
              isDark={isDark}
            />
          </motion.div>
        )}

        {/* Business Details (consolidated form) */}
        {(step === 'business-details' || step === 'business-uvp' || step === 'business-offering' || step === 'business-contact') && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
            <BusinessDetailsForm
              isDark={isDark}
              businessInfo={businessInfo}
              onComplete={handleBusinessDetailsComplete}
            />
          </motion.div>
        )}

        {/* Template Gallery — skipped when template pre-selected via Use Template flow */}
        {step === 'template' && !initialState?.selectedTemplateId && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
            <TemplateGallery
              recommendations={recommendations}
              recommendationsLoading={recommendationsLoading}
              recommendationsError={recommendationsError}
              onRecommendationSelect={handleRecommendationSelect}
              onPreviewRecommendation={openPreview}
              onRetryRecommendations={fetchRecommendations}
              templates={templates}
              templatesLoading={templatesLoading}
              templatesError={templatesError}
              onTemplateSelect={handleTemplateSelect}
              onPreview={openPreview}
              onRetryTemplates={refetchTemplates}
              isDark={isDark}
            />
          </motion.div>
        )}

        {/* Personalization Panel */}
        {step === 'personalization' && (
          <PersonalizationPanel
            isDark={isDark}
            fontsLoaded={fontsLoaded}
            templatePalette={templatePalette || null}
            templatePalettes={selectedRecommendation?.palettes}
            templateFonts={selectedRecommendation?.fonts}
            businessInfo={businessInfo || undefined}
            initialUseAiImages={initialState?.useAiImages}
            onPaletteSelect={handlePaletteSelect}
            onCustomPaletteClick={() => setShowCustomPalette(true)}
            onFontSelect={handleFontSelect}
            onLogoSelect={handleLogoSelect}
          />
        )}

        {/* Integrations (modal-based cards) */}
        {step === 'integrations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
            <IntegrationModal
              isDark={isDark}
              onComplete={handleIntegrationsComplete}
              onSkip={handleSkipIntegrations}
            />
          </motion.div>
        )}

        {/* Custom Palette Modal */}
        <CustomPaletteModal
          isOpen={showCustomPalette}
          isDark={isDark}
          customColors={customColors}
          onColorsChange={setCustomColors}
          onClose={() => setShowCustomPalette(false)}
          onSubmit={palette => {
            setShowCustomPalette(false);
            handlePaletteSelect(palette);
          }}
        />

        {/* Creating indicator */}
        <CreatingIndicator
          isCreating={(step === 'creating' || isCloning || agentRunning) && !orchestratorRunning}
          isDark={isDark}
          currentStep={buildStep || (agentRunning ? 'Applying your changes...' : undefined)}
          progress={buildProgress}
          buildPhase={buildPhase}
        />

        {/* Build activity feed — shown during initial site build */}
        {step === 'creating' && activityEvents.length > 0 && (
          <BuildActivityFeed
            events={activityEvents}
            isDark={isDark}
            buildPhase={buildPhase}
            progress={buildProgress}
            currentStep={buildStep || undefined}
          />
        )}

        {/* Agent activity log — shown during post-build AI edits */}
        {step !== 'creating' && agentRunning && activityEvents.length > 0 && (
          <AgentActivityLog
            events={activityEvents}
            isDark={isDark}
            isActive={agentIsActive}
            progress={buildProgress}
            buildPhase={buildPhase as import('./types').BuildPhase}
          />
        )}

        {/* Typing indicator */}
        <TypingIndicator isTyping={isTyping} />

        <div ref={messagesEndRef} />
      </div>

      {/* Chat input (only visible during chat-based steps) */}
      {chatInputVisible && (
        <ChatInput
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={() => handleSend(attachedImages)}
          step={step}
          isDark={isDark}
          attachedImages={attachedImages}
          attachmentMenuOpen={attachmentMenuOpen}
          setAttachmentMenuOpen={setAttachmentMenuOpen}
          attachmentMenuRef={attachmentMenuRef}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onScreenshot={handleScreenshot}
          onRemoveImage={removeAttachedImage}
          onClearImages={clearAttachedImages}
        />
      )}

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        isOpen={!!previewTemplate}
        template={previewTemplate}
        initialPalette={ColorPaletteToColorPalette(previewPalette)}
        recommendationPalettes={previewRecommendation?.palettes}
        onClose={() => {
          setPreviewTemplate(null);
          setPreviewRecommendation(null);
        }}
        onUseTemplate={(template, palette) => {
          setPreviewTemplate(null);
          setPreviewRecommendation(null);
          setSelectedPalette(palette);
          handleTemplateSelect(template);
        }}
      />
    </div>
  );
}
