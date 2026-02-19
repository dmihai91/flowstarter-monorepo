/* eslint-disable no-restricted-imports */
import { useStore } from '@nanostores/react';
import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { themeStore, getEffectiveTheme } from '~/lib/stores/theme';
import { EditorUserMessage, EditorAssistantMessage, EditorMessageWrapper } from '../EditorMessage';
import { TemplatePreviewDialog } from '../TemplatePreviewDialog';
import { useOptionalConversationContext } from '../ConversationContext';

import { useEditorChatState, useAttachments, useFontsLoader, useConvexSync, useMessagePagination } from './hooks';
import { ColorPaletteToColorPalette } from './utils';
import {
  SuggestedReplies,
  TemplateGallery,
  TemplateRecommendationGallery,
  PaletteSelector,
  CustomPaletteModal,
  FontSelector,
  PersonalizationPanel,
  ContactDetailsPanel,
  IntegrationsPanel,
  ChatInput,
  TypingIndicator,
  CreatingIndicator,
  QuickProfileSelector, // NEW: Streamlined onboarding component
} from './components';
import type { EditorChatPanelProps } from './types';

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
}: EditorChatPanelProps) {
  const theme = useStore(themeStore);
  const effectiveTheme = theme === 'system' ? getEffectiveTheme() : theme;
  const isDark = effectiveTheme === 'dark';

  // Load fonts
  const { fontsLoaded, fontError } = useFontsLoader();

  // Log font errors (could be displayed in UI if desired)
  useEffect(() => {
    if (fontError) {
      console.warn('[EditorChatPanel] Font loading issue:', fontError);
    }
  }, [fontError]);

  // Chat state management
  const {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    step,
    suggestedReplies,
    isTyping,
    thumbnailErrors,
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
    templatesLoading,
    templatesError,
    refetchTemplates,
    isCloning,

    agentRunning,

    // Orchestrator state (future: Daytona)
    orchestratorStatus,
    orchestratorRunning,
    stopOrchestration,

    // Build progress (for CreatingIndicator)
    buildStep,
    buildProgress,
    buildPhase,

    // Template recommendations
    recommendations,
    recommendationsLoading,
    recommendationsError,
    selectedRecommendation,
    fetchRecommendations,

    // State for Convex sync
    businessInfo,
    selectedPalette,
    selectedFont,
    selectedLogo,
    projectName,
    projectDescription,
    currentUrlId,

    // Quick Profile (streamlined flow)
    quickProfile,
    suggestedQuickProfile,
    handleQuickProfileComplete,

    // Handlers
    handleTemplateSelect,
    handleRecommendationSelect,
    handlePaletteSelect,
    handleFontSelect,
    handleLogoSelect,
    handleContactDetailsComplete,
    handleSkipContactDetails,
    handleIntegrationsComplete,
    handleSkipIntegrations,
    handleSuggestionAccept,
    handleSend,
    handleThumbnailError,
    refreshSuggestions,
    openPreview,
    setPreviewTemplate,
    previewRecommendation,
    setPreviewRecommendation,
  } = useEditorChatState({ onProjectReady, onPreviewChange, initialState, onStateChange, externalProjectId });

  // Get conversation context (optional - may not exist on /new route)
  const conversationContext = useOptionalConversationContext();
  const activeConversation = conversationContext?.activeConversation || null;

  // Get effective project ID: prefer external prop, then from conversation context
  const effectiveProjectId = externalProjectId || activeConversation?.projectId || null;

  // Message pagination — loads messages in batches with infinite scroll
  const {
    hasMore: hasMoreMessages,
    isLoadingMore: isLoadingMoreMessages,
    scrollContainerRef: paginationScrollRef,
  } = useMessagePagination({
    conversationId: activeConversation?.id || null,
    pageSize: 30,
    enabled: Boolean(activeConversation?.id),
  });

  /*
   * Comprehensive Convex sync - messages, state, and files
   * Starts immediately on first user interaction (message sent or suggestion clicked)
   * Uses hash-based change detection to prevent infinite loops
   */
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

    // Enable sync as soon as we have a project ID, conversation exists, or messages exist
    enabled: Boolean(effectiveProjectId) || Boolean(activeConversation) || messages.length > 0,

    // Use shorter debounce (500ms) for more responsive syncing
    debounceMs: 500,
  });

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // Notify parent of orchestration status changes
  useEffect(() => {
    if (orchestratorStatus) {
      onOrchestrationStatusChange?.(orchestratorStatus);
    }
  }, [orchestratorStatus, onOrchestrationStatusChange]);

  // Attachment handling
  const {
    attachmentMenuOpen,
    setAttachmentMenuOpen,
    attachedImages,
    fileInputRef,
    attachmentMenuRef,
    handleFileSelect,
    handleScreenshot,
    removeAttachedImage,
    clearAttachedImages,
  } = useAttachments();

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        background: isDark
          ? `radial-gradient(ellipse at 0% 0%, rgba(165, 90, 172, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse 80% 60% at 0% 100%, rgba(145, 140, 69, 0.14) 0%, transparent 60%),
          radial-gradient(ellipse 130% 70% at 50% 100%, rgba(145, 140, 69, 0.10) 0%, transparent 65%),
          linear-gradient(165deg, #0d0d14 0%, #13111c 35%, #1a1625 65%, #1e1a24 85%, #181614 100%)`
          : `radial-gradient(ellipse at 0% 0%, rgba(165, 90, 172, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 120% 80% at 50% 100%, rgba(145, 140, 69, 0.22) 0%, transparent 70%),
          #ffffff`,
      }}
    >
      {/* Messages area */}
      <div
        ref={paginationScrollRef}
        className={`flex-1 overflow-y-auto pl-4 pr-4 py-6 space-y-6 scrollbar-thin scrollbar-track-transparent ${isDark ? 'scrollbar-thumb-white/10' : 'scrollbar-thumb-black/10'}`}
      >
        {/* Loading older messages indicator */}
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
            <span className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>↑ Scroll up for older messages</span>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg) => (
            <EditorMessageWrapper key={msg.id} id={msg.id}>
              {msg.role === 'assistant' && (
                <EditorAssistantMessage
                  content={msg.content}
                  timestamp={msg.timestamp}
                  isDark={isDark}
                  component={msg.component}
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

        {/* Suggested Replies */}
        <SuggestedReplies
          suggestions={suggestedReplies}
          step={step}
          isDark={isDark}
          onAccept={handleSuggestionAccept}
          onRefresh={refreshSuggestions}
        />

        {/* Quick Profile Selector (streamlined onboarding step) */}
        {step === 'quick-profile' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="ml-10"
          >
            <QuickProfileSelector
              initialProfile={suggestedQuickProfile}
              onComplete={handleQuickProfileComplete}
              isDark={isDark}
            />
          </motion.div>
        )}

        {/* Template Recommendations - only show when loading or has recommendations */}
        {step === 'template' && (recommendationsLoading || recommendations.length > 0) && (
          <div className="ml-10">
            <TemplateRecommendationGallery
              recommendations={recommendations}
              isLoading={recommendationsLoading}
              error={recommendationsError}
              isDark={isDark}
              onSelect={handleRecommendationSelect}
              onPreview={openPreview}
              onRetry={fetchRecommendations}
            />
          </div>
        )}

        {/* Template Gallery fallback - show when no recommendations after loading */}
        {step === 'template' && recommendations.length === 0 && !recommendationsLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-10">
            <TemplateGallery
              templates={templates}
              templatesLoading={templatesLoading}
              templatesError={templatesError}
              thumbnailErrors={thumbnailErrors}
              isDark={isDark}
              onTemplateSelect={handleTemplateSelect}
              onPreview={openPreview}
              onRetry={refetchTemplates}
              onThumbnailError={handleThumbnailError}
            />
          </motion.div>
        )}

        {/* Contact Details Panel (during onboarding) */}
        {step === 'business-contact' && (
          <ContactDetailsPanel
            isDark={isDark}
            initialData={initialState?.contactDetails}
            onComplete={handleContactDetailsComplete}
            onSkip={handleSkipContactDetails}
          />
        )}

        {/* Personalization Panel (Palette, Font, Logo, AI Images toggle) */}
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

        {/* Integrations Panel (Calendly, Mailchimp, etc.) */}
        {step === 'integrations' && (
          <IntegrationsPanel
            isDark={isDark}
            onComplete={handleIntegrationsComplete}
            onSkip={handleSkipIntegrations}
          />
        )}

        {/* Custom Palette Modal */}
        <CustomPaletteModal
          isOpen={showCustomPalette}
          isDark={isDark}
          customColors={customColors}
          onColorsChange={setCustomColors}
          onClose={() => setShowCustomPalette(false)}
          onSubmit={(palette) => {
            setShowCustomPalette(false);
            handlePaletteSelect(palette);
          }}
        />

        {/* Creating indicator - shows during template cloning and agent execution */}
        <CreatingIndicator
          isCreating={(step === 'creating' || isCloning || agentRunning) && !orchestratorRunning}
          isDark={isDark}
          currentStep={buildStep || (agentRunning ? 'Applying your changes...' : undefined)}
          progress={buildProgress}
          buildPhase={buildPhase}
        />

        {/* Typing indicator */}
        <TypingIndicator isTyping={isTyping} />

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
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
