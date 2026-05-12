export default {
  from: '0.1',
  to: '0.2',
  apply(doc) {
    return {
      ...doc,
      version: '0.2',
      memories: doc.memories.map((m) => {
        const newMetadata = {
          ...m.metadata,
          tags: m.metadata.tags ?? [],
        };
        return { ...m, metadata: newMetadata };
      }),
    };
  },
};
